import { useState } from 'react';
import { motion } from 'framer-motion';

interface ElementDef {
  id: string;
  type: string;
  name: string;
  icon: string;
  defaultSize?: { width: number; height: number }; // in cents
  category: 'building' | 'plant' | 'element';
}

const COMMON_ELEMENTS: ElementDef[] = [
  { id: 'house', type: 'house', name: 'House', icon: '🏠', defaultSize: { width: 3, height: 3 }, category: 'building' }, // ~1300 sq ft
  { id: 'cow', type: 'livestock', name: 'Cow', icon: '🐄', defaultSize: { width: 0.1, height: 0.1 }, category: 'element' }, // ~40 sq ft per cow
  { id: 'coconut', type: 'tree', name: 'Coconut Tree', icon: '🌴', defaultSize: { width: 0.02, height: 0.02 }, category: 'plant' }, // ~10 sq ft (tree canopy footprint)
  { id: 'well', type: 'well', name: 'Well', icon: '💧', defaultSize: { width: 0.03, height: 0.03 }, category: 'element' }, // ~15 sq ft
  { id: 'storage', type: 'storage', name: 'Storage', icon: '📦', defaultSize: { width: 0.7, height: 0.7 }, category: 'building' }, // ~300 sq ft
  { id: 'shed', type: 'livestock-shed', name: 'Livestock Shed', icon: '🏚️', defaultSize: { width: 0.6, height: 0.6 }, category: 'building' }, // ~250 sq ft
];

interface ElementPaletteProps {
  onDragStart: (element: ElementDef) => void;
  farmName: string;
  farmDescription?: string;
  onEditFarmInfo: () => void;
}

export const ElementPalette = ({ onDragStart, farmName, farmDescription, onEditFarmInfo }: ElementPaletteProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredElements = COMMON_ELEMENTS.filter(el =>
    el.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Farm Info Section */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {farmName}
          </h3>
          <button
            onClick={onEditFarmInfo}
            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            ✏️ Edit
          </button>
        </div>
        {farmDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{farmDescription}</p>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        🎨 Elements
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Drag elements to your farm
      </p>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search elements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
        />
      </div>

      {/* Common Elements */}
      <div className="space-y-2">
        {filteredElements.map((element) => (
          <motion.div
            key={element.id}
            draggable
            onDragStart={() => onDragStart(element)}
            className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-grab active:cursor-grabbing border border-gray-200 dark:border-gray-600 flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-2xl">{element.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{element.name}</div>
              {element.defaultSize && (
                <div className="text-xs text-gray-500">
                  {element.defaultSize.width * 435.6} sq ft
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
