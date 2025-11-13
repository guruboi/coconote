import { useFarmStore } from '@/stores/farmStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FarmRenderer } from '@/components/FarmRenderer';
import { ElementPalette } from '@/components/ElementPalette';

export const FarmView = () => {
  const navigate = useNavigate();
  const { getCurrentFarm, viewState, setMode, setSelectedLayer, deleteFarm, updateFarm } = useFarmStore();
  const farm = getCurrentFarm();

  const [showGrid, setShowGrid] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draggingElement, setDraggingElement] = useState<any>(null);

  useEffect(() => {
    if (!farm) {
      navigate('/');
    }
  }, [farm, navigate]);

  if (!farm) return null;

  const totalPlants = farm.plantConfigurations.reduce(
    (sum, config) => sum + (config.rows * config.columns),
    0
  );

  const handleLayerChange = (layer: number) => {
    setSelectedLayer(layer);
  };

  const handleDeleteFarm = () => {
    if (farm) {
      deleteFarm(farm.id);
      navigate('/');
    }
  };

  const handleDeleteBuilding = (buildingId: string) => {
    if (farm) {
      updateFarm(farm.id, {
        buildings: farm.buildings.filter(b => b.id !== buildingId),
      });
    }
  };

  const handleDeletePlantConfig = (configId: string) => {
    if (farm) {
      updateFarm(farm.id, {
        plantConfigurations: farm.plantConfigurations.filter(c => c.id !== configId),
        plants: farm.plants.filter(p => p.configId !== configId),
      });
    }
  };

  const handleDeleteElement = (elementId: string) => {
    if (farm) {
      updateFarm(farm.id, {
        otherElements: farm.otherElements.filter(e => e.id !== elementId),
      });
    }
  };

  const handleElementDragStart = (element: any) => {
    setDraggingElement(element);
  };

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {farm.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{farm.description}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                🗑️ Delete Farm
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Back to Farms
              </button>
            </div>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex flex-wrap gap-3 mb-6">
          {(['view', 'edit', 'pipeline', 'livestock'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                viewState.mode === mode
                  ? 'bg-farm-green-600 text-pearl'
                  : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 hover:bg-farm-green-100 dark:hover:bg-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
            </button>
          ))}

          {/* Layer selector for multilayer farming */}
          {farm.farmingType === 'multilayer' && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600 dark:text-gray-400">Layer:</span>
              {Array.from({ length: 5 }, (_, i) => i + 1).map((layer) => (
                <button
                  key={layer}
                  onClick={() => handleLayerChange(layer)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                    viewState.selectedLayer === layer
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showGrid
                ? 'bg-farm-green-600 text-pearl'
                : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300'
            }`}
          >
            {showGrid ? '✓' : '○'} Grid
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showStats
                ? 'bg-farm-green-600 text-pearl'
                : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300'
            }`}
          >
            {showStats ? '✓' : '○'} Stats
          </button>
        </div>

        {/* Farm canvas area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-pearl dark:bg-bg-dark-alt rounded-xl overflow-hidden shadow-lg"
        >
          <FarmRenderer
            farm={farm}
            width={1200}
            height={700}
            showGrid={showGrid}
            currentLayer={viewState.selectedLayer}
            isEditMode={viewState.mode === 'edit'}
            draggingElement={draggingElement}
          />
        </motion.div>

        {/* Farm statistics */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-pearl dark:bg-bg-dark-alt rounded-lg p-4">
              <div className="text-2xl mb-1">🏗️</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {farm.buildings.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Buildings</div>
            </div>

            <div className="bg-pearl dark:bg-bg-dark-alt rounded-lg p-4">
              <div className="text-2xl mb-1">🌳</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {totalPlants}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Plants/Trees
              </div>
            </div>

            <div className="bg-pearl dark:bg-bg-dark-alt rounded-lg p-4">
              <div className="text-2xl mb-1">📐</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {farm.plantConfigurations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Plant Configurations
              </div>
            </div>

            <div className="bg-pearl dark:bg-bg-dark-alt rounded-lg p-4">
              <div className="text-2xl mb-1">📍</div>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {farm.otherElements.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Other Elements
              </div>
            </div>
          </motion.div>
        )}

        {/* Plant configurations list */}
        {farm.plantConfigurations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Plant Configurations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {farm.plantConfigurations.map((config) => (
                <div
                  key={config.id}
                  className="bg-pearl dark:bg-bg-dark-alt rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {config.category === 'tree' ? '🌴' :
                       config.category === 'plant' ? '🌿' : '🌾'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {config.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {config.plantType}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-500">
                        <div>Grid: {config.rows}×{config.columns} = {config.rows * config.columns} plants</div>
                        <div>Spacing: {config.spacingBetweenRows}ft × {config.spacingBetweenColumns}ft</div>
                        {farm.farmingType === 'multilayer' && <div>Layer: {config.layer}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Delete Farm?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete <strong>{farm.name}</strong>? This action cannot be undone. All farm data including buildings, plants, and configurations will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteFarm}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Delete Farm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Mode Panel */}
        <AnimatePresence>
          {viewState.mode === 'edit' && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-96 bg-pearl dark:bg-bg-dark-alt shadow-2xl z-40 overflow-y-auto"
            >
              <ElementPalette onDragStart={handleElementDragStart} />

              <div className="p-6">
                {/* Buildings */}
                {farm.buildings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Buildings ({farm.buildings.length})
                    </h3>
                    <div className="space-y-2">
                      {farm.buildings.map((building) => (
                        <div
                          key={building.id}
                          className="flex items-center justify-between p-3 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {building.type === 'house' ? '🏠' :
                               building.type === 'livestock-shed' ? '🐄' :
                               building.type === 'storage' ? '📦' : '⚡'}
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                              {building.name || building.type}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteBuilding(building.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete building"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plant Configurations */}
                {farm.plantConfigurations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Plant Configurations ({farm.plantConfigurations.length})
                    </h3>
                    <div className="space-y-2">
                      {farm.plantConfigurations.map((config) => (
                        <div
                          key={config.id}
                          className="flex items-center justify-between p-3 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {config.category === 'tree' ? '🌴' :
                               config.category === 'plant' ? '🌿' : '🌾'}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {config.name}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {config.rows}×{config.columns} = {config.rows * config.columns} plants
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePlantConfig(config.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete configuration"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Elements */}
                {farm.otherElements.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Other Elements ({farm.otherElements.length})
                    </h3>
                    <div className="space-y-2">
                      {farm.otherElements.map((element) => (
                        <div
                          key={element.id}
                          className="flex items-center justify-between p-3 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {element.type === 'well' ? '🏗️' :
                               element.type === 'borewell' ? '⚙️' :
                               element.type === 'bee-box' ? '🐝' : '📍'}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {element.name}
                              </div>
                              {element.quantity && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Quantity: {element.quantity}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteElement(element.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete element"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-farm-green-50 dark:bg-farm-green-900/20 border border-farm-green-500 rounded-lg">
                  <p className="text-sm text-farm-green-800 dark:text-farm-green-300 font-semibold mb-2">
                    🎯 Position Your Elements
                  </p>
                  <p className="text-sm text-farm-green-700 dark:text-farm-green-400">
                    Drag and drop buildings, plants, and other elements directly on the farm to position them. Click elements to select them, then delete if needed.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
