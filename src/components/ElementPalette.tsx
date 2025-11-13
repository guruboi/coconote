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
  { id: 'house', type: 'house', name: 'House', icon: '🏠', defaultSize: { width: 10, height: 10 }, category: 'building' },
  { id: 'cow', type: 'livestock', name: 'Cow', icon: '🐄', defaultSize: { width: 0.5, height: 0.5 }, category: 'element' },
  { id: 'coconut', type: 'tree', name: 'Coconut Tree', icon: '🌴', defaultSize: { width: 0.1, height: 0.1 }, category: 'plant' },
  { id: 'well', type: 'well', name: 'Well', icon: '💧', defaultSize: { width: 1, height: 1 }, category: 'element' },
  { id: 'storage', type: 'storage', name: 'Storage', icon: '📦', defaultSize: { width: 5, height: 5 }, category: 'building' },
  { id: 'shed', type: 'livestock-shed', name: 'Livestock Shed', icon: '🏚️', defaultSize: { width: 8, height: 8 }, category: 'building' },
];

interface ElementPaletteProps {
  onDragStart: (element: ElementDef) => void;
}

export const ElementPalette = ({ onDragStart }: ElementPaletteProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredElements = COMMON_ELEMENTS.filter(el =>
    el.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        🎨 Elements
      </h2>

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

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Drag elements to your farm
      </p>

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
