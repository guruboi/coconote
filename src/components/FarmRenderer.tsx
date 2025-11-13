import { useMemo } from 'react';
import type { Farm } from '@/types/farm.types';

interface FarmRendererProps {
  farm: Farm;
  width?: number;
  height?: number;
  showGrid?: boolean;
  currentLayer?: number;
}

export const FarmRenderer = ({
  farm,
  width = 800,
  height = 600,
  showGrid = false,
  currentLayer = 1
}: FarmRendererProps) => {

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

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: boundaryWidth,
      height: boundaryHeight,
      scale,
      offsetX: padding + (availableWidth - boundaryWidth * scale) / 2,
      offsetY: padding + (availableHeight - boundaryHeight * scale) / 2
    };
  }, [farm.boundary.points, width, height]);

  // Transform a point from farm coordinates to SVG coordinates
  const transformPoint = (x: number, y: number) => {
    return {
      x: bounds.offsetX + (x - bounds.minX) * bounds.scale,
      y: bounds.offsetY + (y - bounds.minY) * bounds.scale
    };
  };

  // Convert position string to coordinates
  const getPositionCoordinates = (position: string) => {
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

    return positions[position] || positions['center'];
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

      const iconMap: Record<string, string> = {
        'house': '🏠',
        'livestock-shed': '🐄',
        'storage': '📦',
        'motor-room': '⚡',
      };

      return (
        <g key={building.id}>
          <rect
            x={transformed.x - 20}
            y={transformed.y - 20}
            width={40}
            height={40}
            fill="rgba(139, 92, 46, 0.3)"
            stroke="#8b5c2e"
            strokeWidth={2}
            rx={4}
          />
          <text
            x={transformed.x}
            y={transformed.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
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
                strokeWidth={1}
              />
              <text
                x={transformed.x}
                y={transformed.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
              >
                {icon}
              </text>
            </g>
          );
        }
      }

      return <g key={config.id}>{plants}</g>;
    });
  };

  // Render other elements
  const renderOtherElements = () => {
    return farm.otherElements.map((element) => {
      const pos = typeof element.position === 'string'
        ? getPositionCoordinates(element.position)
        : element.position;
      const transformed = transformPoint(pos.x, pos.y);

      const iconMap: Record<string, string> = {
        'well': '💧',
        'borewell': '🕳️',
        'bee-box': '🐝',
        'electricity-post': '⚡',
        'pit': '⬛',
        'livestock': '🐄',
      };

      return (
        <g key={element.id}>
          <circle
            cx={transformed.x}
            cy={transformed.y}
            r={16}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth={2}
          />
          <text
            x={transformed.x}
            y={transformed.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
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
          >
            {element.name}
          </text>
        </g>
      );
    });
  };

  // Render entry point
  const renderEntry = () => {
    if (!farm.entry) return null;

    let entryX = 0, entryY = 0;
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    switch (farm.entry.side) {
      case 'north':
        entryY = bounds.minY;
        entryX = farm.entry.alignment === 'center' ? centerX :
                farm.entry.alignment === 'top-left' ? bounds.minX + bounds.width * 0.2 :
                farm.entry.alignment === 'top-right' ? bounds.maxX - bounds.width * 0.2 :
                centerX;
        break;
      case 'south':
        entryY = bounds.maxY;
        entryX = farm.entry.alignment === 'center' ? centerX :
                farm.entry.alignment === 'bottom-left' ? bounds.minX + bounds.width * 0.2 :
                farm.entry.alignment === 'bottom-right' ? bounds.maxX - bounds.width * 0.2 :
                centerX;
        break;
      case 'east':
        entryX = bounds.maxX;
        entryY = centerY;
        break;
      case 'west':
        entryX = bounds.minX;
        entryY = centerY;
        break;
    }

    const transformed = transformPoint(entryX, entryY);

    return (
      <g>
        <circle
          cx={transformed.x}
          cy={transformed.y}
          r={12}
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth={2}
        />
        <text
          x={transformed.x}
          y={transformed.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
        >
          🚪
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto"
      >
        {/* Background grid */}
        {showGrid && (
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
        )}

        {showGrid && (
          <rect width={width} height={height} fill="url(#grid)" />
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
        {renderPlants()}
        {renderBuildings()}
        {renderOtherElements()}
        {renderEntry()}

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
