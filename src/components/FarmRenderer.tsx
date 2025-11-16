import { useMemo, useState, useRef, useEffect } from 'react';
import type { Farm, Point } from '@/types/farm.types';
import { useFarmStore } from '@/stores/farmStore';

interface FarmRendererProps {
  farm: Farm;
  width?: number;
  height?: number;
  currentLayer?: number;
  isEditMode?: boolean;
  draggingElement?: any;
  isDrawingPath?: boolean;
  currentPathPoints?: Point[];
  onAddPathPoint?: (point: Point) => void;
  isDrawingPipeline?: boolean;
  currentPipelinePoints?: Point[];
  onAddPipelinePoint?: (point: Point) => void;
  pipelineType?: 'irrigation' | 'underground';
  selectedPathPoints?: { pathId: string; indices: number[] }[];
  onSelectedPathPointsChange?: (selected: { pathId: string; indices: number[] }[]) => void;
  selectedPipelinePoints?: { pipelineId: string; indices: number[] }[];
  onSelectedPipelinePointsChange?: (selected: { pipelineId: string; indices: number[] }[]) => void;
  onBuildingClick?: (buildingId: string) => void;
  onPlantClick?: (configId: string, row: number, col: number) => void;
}

interface DragState {
  isDragging: boolean;
  elementType: 'building' | 'plantConfig' | 'otherElement' | 'pathPoint' | null;
  elementId: string | null;
  pointIndex?: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export const FarmRenderer = ({
  farm,
  width = 800,
  height = 600,
  currentLayer = 1,
  isEditMode = false,
  draggingElement,
  isDrawingPath = false,
  currentPathPoints = [],
  onAddPathPoint,
  isDrawingPipeline = false,
  currentPipelinePoints = [],
  onAddPipelinePoint,
  pipelineType = 'irrigation',
  selectedPathPoints = [],
  onSelectedPathPointsChange,
  selectedPipelinePoints = [],
  onSelectedPipelinePointsChange,
  onBuildingClick,
  onPlantClick
}: FarmRendererProps) => {
  const { updateFarm } = useFarmStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementType: null,
    elementId: null,
    pointIndex: undefined,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  // Calculate the bounding box of the farm
  const bounds = useMemo(() => {
    if (!farm.boundary.points || farm.boundary.points.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: width,
        maxY: height,
        width: width,
        height: height,
        scale: 1,
        offsetX: 0,
        offsetY: 0
      };
    }

    const xs = farm.boundary.points.map(p => p.x);
    const ys = farm.boundary.points.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const boundaryWidth = maxX - minX;
    const boundaryHeight = maxY - minY;

    // Add padding
    const padding = 40;
    const availableWidth = width - (padding * 2);
    const availableHeight = height - (padding * 2);

    // Calculate scale to fit the boundary in the viewport
    const scaleX = availableWidth / boundaryWidth;
    const scaleY = availableHeight / boundaryHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate grid cell size (1 sq ft)
    // Farm area in acres, 1 acre = 43,560 sq ft
    const areaInSqFt = farm.boundary.area * 43560;
    // Farm boundary area in coordinate units
    const boundaryArea = boundaryWidth * boundaryHeight;
    // 1 sq ft in coordinate units
    const gridCellSize = Math.sqrt(boundaryArea / areaInSqFt);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: boundaryWidth,
      height: boundaryHeight,
      scale,
      offsetX: padding + (availableWidth - boundaryWidth * scale) / 2,
      offsetY: padding + (availableHeight - boundaryHeight * scale) / 2,
      gridCellSize, // Size of 1 sq ft grid cell in farm coordinates
      areaInSqFt,
    };
  }, [farm.boundary.points, farm.boundary.area, width, height]);

  // Transform a point from farm coordinates to SVG coordinates
  const transformPoint = (x: number, y: number) => {
    return {
      x: bounds.offsetX + (x - bounds.minX) * bounds.scale,
      y: bounds.offsetY + (y - bounds.minY) * bounds.scale
    };
  };

  // Inverse transform: SVG coordinates to farm coordinates
  const inverseTransformPoint = (svgX: number, svgY: number): Point => {
    return {
      x: bounds.minX + (svgX - bounds.offsetX) / bounds.scale,
      y: bounds.minY + (svgY - bounds.offsetY) / bounds.scale
    };
  };

  // Get mouse position relative to SVG
  const getSvgMousePosition = (e: React.MouseEvent<SVGElement> | MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Collision detection helper
  const checkOverlap = (pos1: Point, size1: { width: number; height: number }, pos2: Point, size2: { width: number; height: number }): boolean => {
    // Convert cents to coordinate units (assuming 1 cent ≈ sqrt(435.6) units on each side)
    const scale = Math.sqrt(435.6);
    const box1 = {
      left: pos1.x,
      right: pos1.x + size1.width * scale,
      top: pos1.y,
      bottom: pos1.y + size1.height * scale,
    };
    const box2 = {
      left: pos2.x,
      right: pos2.x + size2.width * scale,
      top: pos2.y,
      bottom: pos2.y + size2.height * scale,
    };

    // Check if boxes overlap
    return !(box1.right < box2.left || box1.left > box2.right || box1.bottom < box2.top || box1.top > box2.bottom);
  };

  // Check if a new element would collide with existing elements
  const wouldCollide = (newPos: Point, newSize: { width: number; height: number }, excludeId?: string | null): boolean => {
    // Check against buildings
    for (const building of farm.buildings) {
      if (building.id === excludeId) continue;
      if (checkOverlap(newPos, newSize, building.position, building.size)) {
        return true;
      }
    }

    // Check against other elements (approximate size if not specified)
    for (const element of farm.otherElements) {
      if (element.id === excludeId || element.type === 'path') continue;
      // Skip if position is a string (general area)
      if (typeof element.position === 'string') continue;
      const elementSize = element.size || { width: 0.1, height: 0.1 }; // Default small size for elements like wells
      if (checkOverlap(newPos, newSize, element.position, elementSize)) {
        return true;
      }
    }

    // Check against plant configurations
    for (const config of farm.plantConfigurations) {
      if (config.id === excludeId) continue;
      // Skip if startingCorner is a string (predefined corner)
      if (typeof config.startingCorner === 'string') continue;
      // Calculate plant configuration spread
      const plantWidth = config.columns * (config.spacingBetweenColumns / 435.6); // Convert sq ft to cents
      const plantHeight = config.rows * (config.spacingBetweenRows / 435.6);
      const plantSize = { width: plantWidth, height: plantHeight };
      if (checkOverlap(newPos, newSize, config.startingCorner, plantSize)) {
        return true;
      }
    }

    return false;
  };

  // Find nearby non-overlapping position
  const findNearbyPosition = (pos: Point, size: { width: number; height: number }, excludeId?: string | null, maxDistance: number = 100): Point => {
    // Try the original position first
    if (!wouldCollide(pos, size, excludeId)) {
      return pos;
    }

    // Try positions in expanding circles around the original position
    const scale = Math.sqrt(435.6); // Convert cents to coordinate units
    const step = size.width * scale / 2; // Use half the element width as step size

    for (let radius = step; radius <= maxDistance; radius += step) {
      // Try 8 positions around the circle
      for (let angle = 0; angle < 360; angle += 45) {
        const radian = (angle * Math.PI) / 180;
        const testPos = {
          x: pos.x + radius * Math.cos(radian),
          y: pos.y + radius * Math.sin(radian)
        };

        if (!wouldCollide(testPos, size, excludeId)) {
          return testPos;
        }
      }
    }

    // If no position found, return original (edge case)
    return pos;
  };

  // Drag-and-drop handlers for palette elements
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isEditMode || !draggingElement) return;

    const svgPos = { x: e.clientX - (svgRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (svgRef.current?.getBoundingClientRect().top || 0) };
    const farmPos = inverseTransformPoint(svgPos.x, svgPos.y);

    // Create element based on category
    if (draggingElement.category === 'building') {
      const size = {
        width: draggingElement.defaultSize?.width || 5,
        height: draggingElement.defaultSize?.height || 5,
      };

      // Find nearby non-overlapping position
      const finalPos = findNearbyPosition(farmPos, size);

      const newBuilding = {
        id: Date.now().toString(),
        type: draggingElement.type,
        name: draggingElement.name,
        position: finalPos,
        size,
        direction: 'north' as const,
      };
      updateFarm(farm.id, { buildings: [...farm.buildings, newBuilding] });
    } else if (draggingElement.category === 'element') {
      const elementSize = { width: 0.1, height: 0.1 }; // Default size for elements

      // Find nearby non-overlapping position
      const finalPos = findNearbyPosition(farmPos, elementSize);

      // Special handling for livestock (cow)
      if (draggingElement.type === 'livestock') {
        // Check if there's a shed to automatically assign to
        const shed = farm.buildings.find(b => b.type === 'livestock-shed');

        if (shed) {
          // Create livestock entry instead of other element
          const newLivestock = {
            id: Date.now().toString(),
            type: 'cow' as const,
            tag: `COW-${Date.now()}`,
            age: 0,
            health: 'good' as const,
          };
          updateFarm(farm.id, { livestock: [...farm.livestock, newLivestock] });
          return; // Don't create the element on the farm
        }
      }

      const newElement = {
        id: Date.now().toString(),
        type: draggingElement.type,
        name: draggingElement.name,
        position: finalPos,
        quantity: 1,
        notes: '',
      };
      updateFarm(farm.id, { otherElements: [...farm.otherElements, newElement] });
    }
  };

  // Drag event handlers for existing elements
  const handleMouseDown = (
    e: React.MouseEvent<SVGElement>,
    elementType: 'building' | 'plantConfig' | 'otherElement',
    elementId: string,
    currentX: number,
    currentY: number
  ) => {
    if (!isEditMode) return;
    e.stopPropagation();

    const svgPos = getSvgMousePosition(e);
    const currentSvgPos = transformPoint(currentX, currentY);

    setDragState({
      isDragging: true,
      elementType,
      elementId,
      startX: svgPos.x,
      startY: svgPos.y,
      offsetX: svgPos.x - currentSvgPos.x,
      offsetY: svgPos.y - currentSvgPos.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !isEditMode) return;

    const svgPos = getSvgMousePosition(e);
    const newSvgX = svgPos.x - dragState.offsetX;
    const newSvgY = svgPos.y - dragState.offsetY;
    const farmPos = inverseTransformPoint(newSvgX, newSvgY);

    // Update element position based on type
    if (dragState.elementType === 'building') {
      const updatedBuildings = farm.buildings.map(b =>
        b.id === dragState.elementId ? { ...b, position: farmPos } : b
      );
      updateFarm(farm.id, { buildings: updatedBuildings });
    } else if (dragState.elementType === 'plantConfig') {
      const updatedConfigs = farm.plantConfigurations.map(c =>
        c.id === dragState.elementId ? { ...c, startingCorner: farmPos } : c
      );
      updateFarm(farm.id, { plantConfigurations: updatedConfigs });
    } else if (dragState.elementType === 'otherElement') {
      const updatedElements = farm.otherElements.map(e =>
        e.id === dragState.elementId ? { ...e, position: farmPos } : e
      );
      updateFarm(farm.id, { otherElements: updatedElements });
    } else if (dragState.elementType === 'pathPoint' && dragState.pointIndex !== undefined) {
      const updatedElements = farm.otherElements.map(e => {
        if (e.id === dragState.elementId && e.points) {
          const newPoints = [...e.points];
          newPoints[dragState.pointIndex!] = farmPos;
          return { ...e, points: newPoints };
        }
        return e;
      });
      updateFarm(farm.id, { otherElements: updatedElements });
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (dragState.isDragging) {
      const svgPos = getSvgMousePosition(e);
      const newSvgX = svgPos.x - dragState.offsetX;
      const newSvgY = svgPos.y - dragState.offsetY;
      const farmPos = inverseTransformPoint(newSvgX, newSvgY);

      // Update element position with smart positioning
      if (dragState.elementType === 'building') {
        const building = farm.buildings.find(b => b.id === dragState.elementId);
        if (building) {
          // Find nearby non-overlapping position (excluding current building)
          const finalPos = findNearbyPosition(farmPos, building.size, dragState.elementId);
          const updatedBuildings = farm.buildings.map(b =>
            b.id === dragState.elementId ? { ...b, position: finalPos } : b
          );
          updateFarm(farm.id, { buildings: updatedBuildings });
        }
      } else if (dragState.elementType === 'plantConfig') {
        const config = farm.plantConfigurations.find(c => c.id === dragState.elementId);
        if (config) {
          const plantWidth = config.columns * (config.spacingBetweenColumns / 435.6);
          const plantHeight = config.rows * (config.spacingBetweenRows / 435.6);
          const plantSize = { width: plantWidth, height: plantHeight };

          // Find nearby non-overlapping position (excluding current config)
          const finalPos = findNearbyPosition(farmPos, plantSize, dragState.elementId);
          const updatedConfigs = farm.plantConfigurations.map(c =>
            c.id === dragState.elementId ? { ...c, startingCorner: finalPos } : c
          );
          updateFarm(farm.id, { plantConfigurations: updatedConfigs });
        }
      } else if (dragState.elementType === 'otherElement') {
        const elementSize = { width: 0.1, height: 0.1 };

        // Find nearby non-overlapping position (excluding current element)
        const finalPos = findNearbyPosition(farmPos, elementSize, dragState.elementId);
        const updatedElements = farm.otherElements.map(e =>
          e.id === dragState.elementId ? { ...e, position: finalPos } : e
        );
        updateFarm(farm.id, { otherElements: updatedElements });
      } else if (dragState.elementType === 'pathPoint' && dragState.pointIndex !== undefined) {
        // Path points don't need collision detection
        const updatedElements = farm.otherElements.map(e => {
          if (e.id === dragState.elementId && e.points) {
            const newPoints = [...e.points];
            newPoints[dragState.pointIndex!] = farmPos;
            return { ...e, points: newPoints };
          }
          return e;
        });
        updateFarm(farm.id, { otherElements: updatedElements });
      }

      setDragState({
        isDragging: false,
        elementType: null,
        elementId: null,
        pointIndex: undefined,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
      });
    }
  };

  // Add global mouse event listeners for drag
  useEffect(() => {
    if (isEditMode && dragState.isDragging) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e);
      const handleUp = (e: MouseEvent) => handleMouseUp(e);

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [dragState.isDragging, isEditMode]);

  // Convert position string to coordinates
  const getPositionCoordinates = (position: string | Point): Point => {
    // If already a Point object, return it
    if (typeof position === 'object' && 'x' in position && 'y' in position) {
      return position;
    }

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    const positions: Record<string, { x: number; y: number }> = {
      'top-left': { x: bounds.minX + bounds.width * 0.15, y: bounds.minY + bounds.height * 0.15 },
      'top-center': { x: centerX, y: bounds.minY + bounds.height * 0.15 },
      'top-right': { x: bounds.maxX - bounds.width * 0.15, y: bounds.minY + bounds.height * 0.15 },
      'center-left': { x: bounds.minX + bounds.width * 0.15, y: centerY },
      'center': { x: centerX, y: centerY },
      'center-right': { x: bounds.maxX - bounds.width * 0.15, y: centerY },
      'bottom-left': { x: bounds.minX + bounds.width * 0.15, y: bounds.maxY - bounds.height * 0.15 },
      'bottom-center': { x: centerX, y: bounds.maxY - bounds.height * 0.15 },
      'bottom-right': { x: bounds.maxX - bounds.width * 0.15, y: bounds.maxY - bounds.height * 0.15 },
    };

    return positions[position as string] || positions['center'];
  };

  // Render boundary polygon
  const boundaryPath = useMemo(() => {
    if (!farm.boundary.points || farm.boundary.points.length === 0) return '';

    const points = farm.boundary.points.map(p => {
      const transformed = transformPoint(p.x, p.y);
      return `${transformed.x},${transformed.y}`;
    }).join(' ');

    return points;
  }, [farm.boundary.points, bounds]);

  // Render buildings
  const renderBuildings = () => {
    return farm.buildings.map((building) => {
      // Building position is a Point object, not a string
      const transformed = transformPoint(building.position.x, building.position.y);
      const isDragging = dragState.isDragging && dragState.elementType === 'building' && dragState.elementId === building.id;

      const iconMap: Record<string, string> = {
        'house': '🏠',
        'livestock-shed': '🐄',
        'storage': '📦',
        'motor-room': '⚡',
      };

      return (
        <g key={building.id}>
          <g
            style={{ cursor: isEditMode && !building.locked ? 'grab' : building.locked ? 'not-allowed' : 'pointer' }}
            opacity={isDragging ? 0.7 : building.locked ? 0.6 : 1}
            onMouseDown={(e) => isEditMode && !building.locked && handleMouseDown(e, 'building', building.id, building.position.x, building.position.y)}
            onClick={(e) => {
              if (!isEditMode && onBuildingClick) {
                e.stopPropagation();
                onBuildingClick(building.id);
              }
            }}
          >
            <rect
              x={transformed.x - 20}
              y={transformed.y - 20}
              width={40}
              height={40}
              fill="rgba(139, 92, 46, 0.3)"
              stroke={building.locked ? '#ef4444' : '#8b5c2e'}
              strokeWidth={isDragging ? 3 : building.locked ? 2 : 2}
              strokeDasharray={building.locked ? '4,2' : 'none'}
              rx={4}
            />
            <text
              x={transformed.x}
              y={transformed.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="24"
              style={{ pointerEvents: 'none' }}
            >
              {iconMap[building.type] || '🏗️'}
            </text>
            <text
              x={transformed.x}
              y={transformed.y + 30}
              textAnchor="middle"
              fontSize="10"
              fill="currentColor"
              className="text-gray-700 dark:text-gray-300"
              style={{ pointerEvents: 'none' }}
            >
              {building.name}
            </text>
            {building.locked && (
              <text
                x={transformed.x + 18}
                y={transformed.y - 18}
                fontSize="12"
                style={{ pointerEvents: 'none' }}
              >
                🔒
              </text>
            )}
          </g>

          {/* Lock/Unlock button in Edit Mode */}
          {isEditMode && (
            <g
              onClick={(e) => {
                e.stopPropagation();
                const updatedBuildings = farm.buildings.map(b =>
                  b.id === building.id ? { ...b, locked: !b.locked } : b
                );
                updateFarm(farm.id, { buildings: updatedBuildings });
              }}
              style={{ cursor: 'pointer' }}
              className="opacity-0 hover:opacity-100 transition-opacity"
            >
              <circle
                cx={transformed.x + 22}
                cy={transformed.y - 22}
                r="10"
                fill="rgba(255, 255, 255, 0.9)"
                stroke="#6b7280"
                strokeWidth="1"
              />
              <text
                x={transformed.x + 22}
                y={transformed.y - 22}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                style={{ pointerEvents: 'none' }}
              >
                {building.locked ? '🔒' : '🔓'}
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  // Render plant configurations as grids
  const renderPlants = () => {
    return farm.plantConfigurations.map((config) => {
      // Only render plants for the current layer in multilayer farming
      if (farm.farmingType === 'multilayer' && config.layer !== currentLayer) {
        return null;
      }

      const plants = [];
      const startPos = getPositionCoordinates(config.startingCorner as any);
      const isDragging = dragState.isDragging && dragState.elementType === 'plantConfig' && dragState.elementId === config.id;

      // Render ALL plants - no skipping
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.columns; col++) {
          // Use spacing directly without multiplying by 2
          const plantX = startPos.x + col * config.spacingBetweenColumns;
          const plantY = startPos.y + row * config.spacingBetweenRows;
          const transformed = transformPoint(plantX, plantY);

          const icon = config.category === 'tree' ? '🌴' :
                      config.category === 'plant' ? '🌿' : '🌾';

          plants.push(
            <g
              key={`${config.id}-${row}-${col}`}
              style={{ cursor: !isEditMode && onPlantClick ? 'pointer' : 'default' }}
              onClick={(e) => {
                if (!isEditMode && onPlantClick) {
                  e.stopPropagation();
                  onPlantClick(config.id, row, col);
                }
              }}
            >
              <circle
                cx={transformed.x}
                cy={transformed.y}
                r={6}
                fill="rgba(34, 197, 94, 0.2)"
                stroke={config.locked ? '#ef4444' : '#22c55e'}
                strokeWidth={isDragging ? 2 : 1}
                strokeDasharray={config.locked ? '2,1' : 'none'}
                className={!isEditMode && onPlantClick ? 'hover:fill-[rgba(34,197,94,0.4)] transition-colors' : ''}
              />
              <text
                x={transformed.x}
                y={transformed.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                style={{ pointerEvents: 'none' }}
              >
                {icon}
              </text>
            </g>
          );
        }
      }

      // Calculate center position for lock button
      const centerX = startPos.x + (config.columns * config.spacingBetweenColumns) / 2;
      const centerY = startPos.y + (config.rows * config.spacingBetweenRows) / 2;
      const transformedCenter = transformPoint(centerX, centerY);

      return (
        <g key={config.id}>
          <g
            style={{ cursor: isEditMode && !config.locked ? 'grab' : config.locked ? 'not-allowed' : 'default' }}
            opacity={isDragging ? 0.7 : config.locked ? 0.6 : 1}
            onMouseDown={(e) => isEditMode && !config.locked && handleMouseDown(e, 'plantConfig', config.id, startPos.x, startPos.y)}
          >
            {plants}
          </g>

          {/* Lock/Unlock button in Edit Mode - appears at center of plant group */}
          {isEditMode && (
            <g
              onClick={(e) => {
                e.stopPropagation();
                const updatedConfigs = farm.plantConfigurations.map(c =>
                  c.id === config.id ? { ...c, locked: !c.locked } : c
                );
                updateFarm(farm.id, { plantConfigurations: updatedConfigs });
              }}
              style={{ cursor: 'pointer' }}
              className="opacity-0 hover:opacity-100 transition-opacity"
            >
              <circle
                cx={transformedCenter.x}
                cy={transformedCenter.y}
                r="12"
                fill="rgba(255, 255, 255, 0.95)"
                stroke="#6b7280"
                strokeWidth="1.5"
              />
              <text
                x={transformedCenter.x}
                y={transformedCenter.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                style={{ pointerEvents: 'none' }}
              >
                {config.locked ? '🔒' : '🔓'}
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  // Render other elements
  const renderOtherElements = () => {
    return farm.otherElements.map((element) => {
      const pos = typeof element.position === 'string'
        ? getPositionCoordinates(element.position)
        : element.position;
      const transformed = transformPoint(pos.x, pos.y);
      const isDragging = dragState.isDragging && dragState.elementType === 'otherElement' && dragState.elementId === element.id;

      const iconMap: Record<string, string> = {
        'well': '💧',
        'borewell': '🕳️',
        'bee-box': '🐝',
        'electricity-post': '⚡',
        'pit': '⬛',
        'livestock': '🐄',
      };

      return (
        <g
          key={element.id}
          style={{ cursor: isEditMode ? 'grab' : 'default' }}
          opacity={isDragging ? 0.7 : 1}
          onMouseDown={(e) => isEditMode && handleMouseDown(e, 'otherElement', element.id, pos.x, pos.y)}
        >
          <circle
            cx={transformed.x}
            cy={transformed.y}
            r={16}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth={isDragging ? 3 : 2}
          />
          <text
            x={transformed.x}
            y={transformed.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
            style={{ pointerEvents: 'none' }}
          >
            {iconMap[element.type] || '📍'}
          </text>
          <text
            x={transformed.x}
            y={transformed.y + 28}
            textAnchor="middle"
            fontSize="9"
            fill="currentColor"
            className="text-gray-700 dark:text-gray-300"
            style={{ pointerEvents: 'none' }}
          >
            {element.name}
          </text>
        </g>
      );
    });
  };

  // Handle SVG click for path and pipeline drawing
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawingPath && onAddPathPoint) {
      const svgPos = getSvgMousePosition(e);
      const farmPos = inverseTransformPoint(svgPos.x, svgPos.y);
      onAddPathPoint(farmPos);
    } else if (isDrawingPipeline && onAddPipelinePoint) {
      const svgPos = getSvgMousePosition(e);
      const farmPos = inverseTransformPoint(svgPos.x, svgPos.y);
      onAddPipelinePoint(farmPos);
    }
  };

  // Render paths
  const renderPaths = () => {
    const paths = farm.otherElements.filter(el => el.type === 'path' && el.points);

    return paths.map((path) => {
      if (!path.points || path.points.length < 2) return null;

      const pathString = path.points.map((point, index) => {
        const transformed = transformPoint(point.x, point.y);
        return `${index === 0 ? 'M' : 'L'} ${transformed.x} ${transformed.y}`;
      }).join(' ');

      return (
        <g key={path.id}>
          {/* Path line */}
          <path
            d={pathString}
            fill="none"
            stroke="#8b5a3c"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Path outline for better visibility */}
          <path
            d={pathString}
            fill="none"
            stroke="#d4a574"
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.3}
          />
          {/* Draggable path points - only show in edit mode when not drawing */}
          {isEditMode && !isDrawingPath && path.points.map((point, index) => {
            const transformed = transformPoint(point.x, point.y);
            const isDragging = dragState.isDragging && dragState.elementType === 'pathPoint' && dragState.elementId === path.id && dragState.pointIndex === index;
            const pathSelection = selectedPathPoints.find(s => s.pathId === path.id);
            const isSelected = pathSelection?.indices.includes(index) ?? false;

            return (
              <circle
                key={`${path.id}-point-${index}`}
                cx={transformed.x}
                cy={transformed.y}
                r={isSelected ? 8 : 6}
                fill={isDragging ? "#f59e0b" : isSelected ? "#3b82f6" : "#8b5a3c"}
                stroke="white"
                strokeWidth={2}
                style={{ cursor: isSelected ? 'pointer' : 'move' }}
                opacity={isDragging ? 0.8 : 1}
                onClick={(e) => {
                  if (!isEditMode) return;
                  e.stopPropagation();

                  // Toggle selection
                  if (onSelectedPathPointsChange) {
                    const currentSelection = selectedPathPoints.find(s => s.pathId === path.id);
                    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

                    if (!currentSelection) {
                      // No selection for this path yet
                      if (isMultiSelect) {
                        onSelectedPathPointsChange([...selectedPathPoints, { pathId: path.id, indices: [index] }]);
                      } else {
                        onSelectedPathPointsChange([{ pathId: path.id, indices: [index] }]);
                      }
                    } else {
                      // Path has selection
                      const indexPos = currentSelection.indices.indexOf(index);
                      if (indexPos >= 0) {
                        // Point is selected, deselect it
                        const newIndices = currentSelection.indices.filter(i => i !== index);
                        if (newIndices.length === 0) {
                          // No more points selected for this path
                          onSelectedPathPointsChange(selectedPathPoints.filter(s => s.pathId !== path.id));
                        } else {
                          onSelectedPathPointsChange(
                            selectedPathPoints.map(s =>
                              s.pathId === path.id ? { ...s, indices: newIndices } : s
                            )
                          );
                        }
                      } else {
                        // Point not selected, add it
                        if (isMultiSelect) {
                          onSelectedPathPointsChange(
                            selectedPathPoints.map(s =>
                              s.pathId === path.id ? { ...s, indices: [...s.indices, index] } : s
                            )
                          );
                        } else {
                          // Single select, replace all selections
                          onSelectedPathPointsChange([{ pathId: path.id, indices: [index] }]);
                        }
                      }
                    }
                  }
                }}
                onMouseDown={(e) => {
                  if (!isEditMode || isSelected) return; // Don't allow dragging selected points
                  e.stopPropagation();
                  const svgPos = getSvgMousePosition(e as any);
                  const currentSvgPos = transformPoint(point.x, point.y);
                  setDragState({
                    isDragging: true,
                    elementType: 'pathPoint',
                    elementId: path.id,
                    pointIndex: index,
                    startX: svgPos.x,
                    startY: svgPos.y,
                    offsetX: svgPos.x - currentSvgPos.x,
                    offsetY: svgPos.y - currentSvgPos.y,
                  });
                }}
              />
            );
          })}
        </g>
      );
    });
  };

  // Render current path being drawn
  const renderCurrentPath = () => {
    if (!isDrawingPath || currentPathPoints.length === 0) return null;

    const pathString = currentPathPoints.map((point, index) => {
      const transformed = transformPoint(point.x, point.y);
      return `${index === 0 ? 'M' : 'L'} ${transformed.x} ${transformed.y}`;
    }).join(' ');

    return (
      <g>
        {/* Current path line */}
        <path
          d={pathString}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5,5"
        />
        {/* Points */}
        {currentPathPoints.map((point, index) => {
          const transformed = transformPoint(point.x, point.y);
          return (
            <circle
              key={index}
              cx={transformed.x}
              cy={transformed.y}
              r={6}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={2}
            />
          );
        })}
      </g>
    );
  };

  // Render pipelines
  const renderPipelines = () => {
    return farm.pipelines.map((pipeline) => {
      if (!pipeline.points || pipeline.points.length < 2) return null;

      const pathString = pipeline.points.map((point, index) => {
        const transformed = transformPoint(point.x, point.y);
        return `${index === 0 ? 'M' : 'L'} ${transformed.x} ${transformed.y}`;
      }).join(' ');

      const color = pipeline.type === 'irrigation' ? '#3b82f6' : '#8b5a3c';

      return (
        <g key={pipeline.id}>
          <path
            d={pathString}
            fill="none"
            stroke={color}
            strokeWidth={pipeline.type === 'irrigation' ? 4 : 6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pipeline.type === 'underground' ? '8,4' : 'none'}
          />
          {/* Selectable pipeline points in edit mode */}
          {isEditMode && !isDrawingPipeline && pipeline.points.map((point, index) => {
            const transformed = transformPoint(point.x, point.y);
            const pipelineSelection = selectedPipelinePoints.find(s => s.pipelineId === pipeline.id);
            const isSelected = pipelineSelection?.indices.includes(index) ?? false;

            return (
              <circle
                key={`${pipeline.id}-point-${index}`}
                cx={transformed.x}
                cy={transformed.y}
                r={isSelected ? 8 : 6}
                fill={isSelected ? "#10b981" : color}
                stroke="white"
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  if (!isEditMode) return;
                  e.stopPropagation();

                  // Toggle selection
                  if (onSelectedPipelinePointsChange) {
                    const currentSelection = selectedPipelinePoints.find(s => s.pipelineId === pipeline.id);
                    const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;

                    if (!currentSelection) {
                      // No selection for this pipeline yet
                      if (isMultiSelect) {
                        onSelectedPipelinePointsChange([...selectedPipelinePoints, { pipelineId: pipeline.id, indices: [index] }]);
                      } else {
                        onSelectedPipelinePointsChange([{ pipelineId: pipeline.id, indices: [index] }]);
                      }
                    } else {
                      // Pipeline has selection
                      const indexPos = currentSelection.indices.indexOf(index);
                      if (indexPos >= 0) {
                        // Point is selected, deselect it
                        const newIndices = currentSelection.indices.filter(i => i !== index);
                        if (newIndices.length === 0) {
                          // No more points selected for this pipeline
                          onSelectedPipelinePointsChange(selectedPipelinePoints.filter(s => s.pipelineId !== pipeline.id));
                        } else {
                          onSelectedPipelinePointsChange(
                            selectedPipelinePoints.map(s =>
                              s.pipelineId === pipeline.id ? { ...s, indices: newIndices } : s
                            )
                          );
                        }
                      } else {
                        // Point not selected, add it
                        if (isMultiSelect) {
                          onSelectedPipelinePointsChange(
                            selectedPipelinePoints.map(s =>
                              s.pipelineId === pipeline.id ? { ...s, indices: [...s.indices, index] } : s
                            )
                          );
                        } else {
                          // Single select, replace all selections
                          onSelectedPipelinePointsChange([{ pipelineId: pipeline.id, indices: [index] }]);
                        }
                      }
                    }
                  }
                }}
              />
            );
          })}
        </g>
      );
    });
  };

  // Render current pipeline being drawn
  const renderCurrentPipeline = () => {
    if (!isDrawingPipeline || currentPipelinePoints.length === 0) return null;

    const pathString = currentPipelinePoints.map((point, index) => {
      const transformed = transformPoint(point.x, point.y);
      return `${index === 0 ? 'M' : 'L'} ${transformed.x} ${transformed.y}`;
    }).join(' ');

    const color = pipelineType === 'irrigation' ? '#3b82f6' : '#8b5a3c';

    return (
      <g>
        <path
          d={pathString}
          fill="none"
          stroke={color}
          strokeWidth={pipelineType === 'irrigation' ? 4 : 6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5,5"
        />
        {currentPipelinePoints.map((point, index) => {
          const transformed = transformPoint(point.x, point.y);
          return (
            <circle
              key={index}
              cx={transformed.x}
              cy={transformed.y}
              r={5}
              fill={color}
              stroke="white"
              strokeWidth={2}
            />
          );
        })}
      </g>
    );
  };

  // Get background color based on soil type
  const getSoilBackground = () => {
    const soilColors = {
      red: { light: '#fed7aa', dark: '#7c2d12' },
      black: { light: '#4b5563', dark: '#18181b' },
      alluvial: { light: '#fef3c7', dark: '#78350f' },
      clay: { light: '#d6d3d1', dark: '#292524' },
      sandy: { light: '#fde68a', dark: '#78350f' },
      loamy: { light: '#d1fae5', dark: '#064e3b' },
      limestone: { light: '#e2e8f0', dark: '#1e293b' },
    };
    return soilColors[farm.soilType] || soilColors.loamy;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto"
        style={{ cursor: (isDrawingPath || isDrawingPipeline) ? 'crosshair' : dragState.isDragging ? 'grabbing' : 'default' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleSvgClick}
      >
        {/* Farm boundary with soil color */}
        {boundaryPath && (
          <polygon
            points={boundaryPath}
            fill={getSoilBackground().light}
            stroke="#16a34a"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        )}

        {/* Fence indicator */}
        {farm.fenced && boundaryPath && (
          <polygon
            points={boundaryPath}
            fill="none"
            stroke="#92400e"
            strokeWidth={2}
            strokeDasharray="8,4"
          />
        )}

        {/* Road borders */}
        {farm.roadBorders?.sides.map((side) => {
          const roadWidth = 30;
          let x1 = 0, y1 = 0, x2 = 0, y2 = 0;

          switch (side) {
            case 'north':
              x1 = bounds.offsetX;
              y1 = bounds.offsetY;
              x2 = bounds.offsetX + bounds.width * bounds.scale;
              y2 = bounds.offsetY;
              break;
            case 'south':
              x1 = bounds.offsetX;
              y1 = bounds.offsetY + bounds.height * bounds.scale;
              x2 = bounds.offsetX + bounds.width * bounds.scale;
              y2 = bounds.offsetY + bounds.height * bounds.scale;
              break;
            case 'east':
              x1 = bounds.offsetX + bounds.width * bounds.scale;
              y1 = bounds.offsetY;
              x2 = bounds.offsetX + bounds.width * bounds.scale;
              y2 = bounds.offsetY + bounds.height * bounds.scale;
              break;
            case 'west':
              x1 = bounds.offsetX;
              y1 = bounds.offsetY;
              x2 = bounds.offsetX;
              y2 = bounds.offsetY + bounds.height * bounds.scale;
              break;
          }

          return (
            <line
              key={side}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#71717a"
              strokeWidth={roadWidth}
              opacity={0.3}
            />
          );
        })}

        {/* Render all farm elements */}
        {renderPipelines()}
        {renderPaths()}
        {renderPlants()}
        {renderBuildings()}
        {renderOtherElements()}
        {renderCurrentPath()}
        {renderCurrentPipeline()}

        {/* Farm info overlay */}
        <g>
          <rect
            x={10}
            y={10}
            width={200}
            height={90}
            fill="rgba(255, 255, 255, 0.9)"
            stroke="#d1d5db"
            strokeWidth={1}
            rx={6}
          />
          <text x={20} y={30} fontSize="14" fontWeight="bold" fill="#1f2937">
            {farm.name}
          </text>
          <text x={20} y={50} fontSize="11" fill="#6b7280">
            Area: {farm.boundary.area} acres
          </text>
          <text x={20} y={68} fontSize="11" fill="#6b7280">
            Type: {farm.farmingType}
          </text>
          <text x={20} y={86} fontSize="11" fill="#6b7280">
            Soil: {farm.soilType}
          </text>
        </g>

        {/* Layer indicator for multilayer farming */}
        {farm.farmingType === 'multilayer' && (
          <g>
            <rect
              x={width - 110}
              y={10}
              width={100}
              height={40}
              fill="rgba(59, 130, 246, 0.9)"
              stroke="#3b82f6"
              strokeWidth={1}
              rx={6}
            />
            <text
              x={width - 60}
              y={35}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill="white"
            >
              Layer {currentLayer}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
