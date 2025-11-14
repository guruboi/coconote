import { useMemo, useState, useRef, useEffect } from 'react';
import type { Farm, Point } from '@/types/farm.types';
import { useFarmStore } from '@/stores/farmStore';

interface FarmRendererProps {
  farm: Farm;
  width?: number;
  height?: number;
  showGrid?: boolean;
  currentLayer?: number;
  isEditMode?: boolean;
  draggingElement?: any;
  isDrawingPath?: boolean;
  currentPathPoints?: Point[];
  onAddPathPoint?: (point: Point) => void;
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
  showGrid = false,
  currentLayer = 1,
  isEditMode = false,
  draggingElement,
  isDrawingPath = false,
  currentPathPoints = [],
  onAddPathPoint
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

  // Smart snap based on element size in cents
  const snapToGrid = (farmPos: Point, sizeInCents: number): Point => {
    const gridSize = bounds.gridCellSize || 1;

    // Calculate how many grid cells this element needs
    const sqFt = sizeInCents * 435.6; // 1 cent = 435.6 sq ft
    const cellsNeeded = Math.ceil(sqFt); // Number of 1 sq ft cells

    // For small elements (< 4 cells), snap to single cell
    if (cellsNeeded < 4) {
      return {
        x: Math.round(farmPos.x / gridSize) * gridSize,
        y: Math.round(farmPos.y / gridSize) * gridSize
      };
    }

    // For larger elements, snap to grid aligned rectangular area
    // Snap top-left corner to grid
    const snappedX = Math.round(farmPos.x / gridSize) * gridSize;
    const snappedY = Math.round(farmPos.y / gridSize) * gridSize;

    return { x: snappedX, y: snappedY };
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

    // Get element size
    const sizeInCents = draggingElement.defaultSize?.width || 1;
    const snappedPos = snapToGrid(farmPos, sizeInCents);

    // Create element based on category
    if (draggingElement.category === 'building') {
      const newBuilding = {
        id: Date.now().toString(),
        type: draggingElement.type,
        name: draggingElement.name,
        position: snappedPos,
        size: {
          width: draggingElement.defaultSize?.width || 5,
          height: draggingElement.defaultSize?.height || 5,
        },
        direction: 'north' as const,
      };
      updateFarm(farm.id, { buildings: [...farm.buildings, newBuilding] });
    } else if (draggingElement.category === 'element') {
      const newElement = {
        id: Date.now().toString(),
        type: draggingElement.type,
        name: draggingElement.name,
        position: snappedPos,
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
      // Snap to grid when dropped
      const svgPos = getSvgMousePosition(e);
      const newSvgX = svgPos.x - dragState.offsetX;
      const newSvgY = svgPos.y - dragState.offsetY;
      const farmPos = inverseTransformPoint(newSvgX, newSvgY);

      // Get element size for smart snapping
      let sizeInCents = 1; // Default size
      if (dragState.elementType === 'building') {
        const building = farm.buildings.find(b => b.id === dragState.elementId);
        sizeInCents = building?.size.width || 5;
      }

      const snappedPos = snapToGrid(farmPos, sizeInCents);

      // Update element position to snapped grid position
      if (dragState.elementType === 'building') {
        const updatedBuildings = farm.buildings.map(b =>
          b.id === dragState.elementId ? { ...b, position: snappedPos } : b
        );
        updateFarm(farm.id, { buildings: updatedBuildings });
      } else if (dragState.elementType === 'plantConfig') {
        const updatedConfigs = farm.plantConfigurations.map(c =>
          c.id === dragState.elementId ? { ...c, startingCorner: snappedPos } : c
        );
        updateFarm(farm.id, { plantConfigurations: updatedConfigs });
      } else if (dragState.elementType === 'otherElement') {
        const updatedElements = farm.otherElements.map(e =>
          e.id === dragState.elementId ? { ...e, position: snappedPos } : e
        );
        updateFarm(farm.id, { otherElements: updatedElements });
      } else if (dragState.elementType === 'pathPoint' && dragState.pointIndex !== undefined) {
        // Path points use regular farmPos, not snapped (for smooth curves)
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
        <g
          key={building.id}
          style={{ cursor: isEditMode ? 'grab' : 'default' }}
          opacity={isDragging ? 0.7 : 1}
          onMouseDown={(e) => isEditMode && handleMouseDown(e, 'building', building.id, building.position.x, building.position.y)}
        >
          <rect
            x={transformed.x - 20}
            y={transformed.y - 20}
            width={40}
            height={40}
            fill="rgba(139, 92, 46, 0.3)"
            stroke="#8b5c2e"
            strokeWidth={isDragging ? 3 : 2}
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
            <g key={`${config.id}-${row}-${col}`}>
              <circle
                cx={transformed.x}
                cy={transformed.y}
                r={6}
                fill="rgba(34, 197, 94, 0.2)"
                stroke="#22c55e"
                strokeWidth={isDragging ? 2 : 1}
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

      return (
        <g
          key={config.id}
          style={{ cursor: isEditMode ? 'grab' : 'default' }}
          opacity={isDragging ? 0.7 : 1}
          onMouseDown={(e) => isEditMode && handleMouseDown(e, 'plantConfig', config.id, startPos.x, startPos.y)}
        >
          {plants}
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

  // Handle SVG click for path drawing
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingPath || !onAddPathPoint) return;

    const svgPos = getSvgMousePosition(e);
    const farmPos = inverseTransformPoint(svgPos.x, svgPos.y);
    onAddPathPoint(farmPos);
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

            return (
              <circle
                key={`${path.id}-point-${index}`}
                cx={transformed.x}
                cy={transformed.y}
                r={6}
                fill={isDragging ? "#f59e0b" : "#8b5a3c"}
                stroke="white"
                strokeWidth={2}
                style={{ cursor: 'move' }}
                opacity={isDragging ? 0.8 : 1}
                onMouseDown={(e) => {
                  if (!isEditMode) return;
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
            <g key={index}>
              <circle
                cx={transformed.x}
                cy={transformed.y}
                r={6}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={transformed.x}
                y={transformed.y - 12}
                textAnchor="middle"
                fontSize="10"
                fill="#3b82f6"
                fontWeight="bold"
              >
                {index + 1}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // Get background color based on soil type
  const getSoilBackground = () => {
    const soilBackgrounds = {
      red: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950',
      black: 'bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-900 dark:to-black',
      alluvial: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950',
      clay: 'bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900',
      sandy: 'bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900',
      loamy: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900',
      limestone: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-900',
    };
    return soilBackgrounds[farm.soilType] || soilBackgrounds.loamy;
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${getSoilBackground()} rounded-lg overflow-hidden`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto"
        style={{ cursor: isDrawingPath ? 'crosshair' : dragState.isDragging ? 'grabbing' : 'default' }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleSvgClick}
      >
        {/* 1 sq ft Grid - clipped to boundary */}
        {showGrid && bounds.gridCellSize && boundaryPath && (
          <>
            <defs>
              <clipPath id="boundary-clip">
                <polygon points={boundaryPath} />
              </clipPath>
              <pattern
                id="sqft-grid"
                width={bounds.gridCellSize * bounds.scale}
                height={bounds.gridCellSize * bounds.scale}
                patternUnits="userSpaceOnUse"
                x={bounds.offsetX - bounds.minX * bounds.scale}
                y={bounds.offsetY - bounds.minY * bounds.scale}
              >
                <path
                  d={`M ${bounds.gridCellSize * bounds.scale} 0 L 0 0 0 ${bounds.gridCellSize * bounds.scale}`}
                  fill="none"
                  stroke="rgba(34, 197, 94, 0.2)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              x={bounds.offsetX}
              y={bounds.offsetY}
              width={bounds.width * bounds.scale}
              height={bounds.height * bounds.scale}
              fill="url(#sqft-grid)"
              clipPath="url(#boundary-clip)"
            />
          </>
        )}

        {/* Farm boundary */}
        {boundaryPath && (
          <polygon
            points={boundaryPath}
            fill="rgba(34, 197, 94, 0.1)"
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
        {renderPaths()}
        {renderPlants()}
        {renderBuildings()}
        {renderOtherElements()}
        {renderCurrentPath()}

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
