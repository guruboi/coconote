import { useFarmStore } from '@/stores/farmStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FarmRenderer } from '@/components/FarmRenderer';

export const FarmView = () => {
  const navigate = useNavigate();
  const { getCurrentFarm, viewState, setMode, setSelectedLayer, deleteFarm, updateFarm } = useFarmStore();
  const farm = getCurrentFarm();

  const [showGrid, setShowGrid] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showAddElement, setShowAddElement] = useState(false);

  // Building form state
  const [buildingType, setBuildingType] = useState<'house' | 'livestock-shed' | 'storage' | 'motor-room'>('house');
  const [buildingName, setBuildingName] = useState('');
  const [buildingWidth, setBuildingWidth] = useState('');
  const [buildingHeight, setBuildingHeight] = useState('');

  // Plant form state
  const [plantConfigName, setPlantConfigName] = useState('');
  const [plantCategory, setPlantCategory] = useState<'tree' | 'plant' | 'crop'>('tree');
  const [plantType, setPlantType] = useState('');
  const [plantRows, setPlantRows] = useState('');
  const [plantColumns, setPlantColumns] = useState('');
  const [plantSpacingRows, setPlantSpacingRows] = useState('');
  const [plantSpacingColumns, setPlantSpacingColumns] = useState('');
  const [plantLayer, setPlantLayer] = useState(1);

  // Element form state
  const [elementType, setElementType] = useState<'well' | 'borewell' | 'bee-box' | 'electricity-post' | 'pit' | 'livestock'>('well');
  const [elementName, setElementName] = useState('');
  const [elementQuantity, setElementQuantity] = useState('');
  const [elementNotes, setElementNotes] = useState('');

  useEffect(() => {
    if (!farm) {
      navigate('/');
    } else {
      setEditingName(farm.name);
      setEditingDescription(farm.description || '');
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

  const handleUpdateFarmInfo = () => {
    if (farm && editingName.trim()) {
      updateFarm(farm.id, {
        name: editingName.trim(),
        description: editingDescription.trim(),
      });
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

  // Calculate farm center from boundary points
  const getFarmCenter = () => {
    if (!farm || farm.boundary.points.length === 0) {
      return { x: 600, y: 350 }; // Default center
    }
    const points = farm.boundary.points;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    return {
      x: sumX / points.length,
      y: sumY / points.length,
    };
  };

  const handleAddBuilding = () => {
    if (!farm || !buildingName.trim() || !buildingWidth || !buildingHeight) return;

    const center = getFarmCenter();
    const newBuilding = {
      id: `building-${Date.now()}`,
      type: buildingType,
      name: buildingName.trim(),
      position: center,
      size: {
        width: parseFloat(buildingWidth),
        height: parseFloat(buildingHeight),
      },
      direction: 'north' as const,
    };

    updateFarm(farm.id, {
      buildings: [...farm.buildings, newBuilding],
    });

    // Clear form and close modal
    setBuildingName('');
    setBuildingWidth('');
    setBuildingHeight('');
    setBuildingType('house');
    setShowAddBuilding(false);
  };

  const handleAddPlant = () => {
    if (!farm || !plantConfigName.trim() || !plantType.trim() ||
        !plantRows || !plantColumns || !plantSpacingRows || !plantSpacingColumns) return;

    const center = getFarmCenter();
    const newConfig = {
      id: `config-${Date.now()}`,
      name: plantConfigName.trim(),
      category: plantCategory,
      plantType: plantType.trim(),
      rows: parseInt(plantRows),
      columns: parseInt(plantColumns),
      spacingBetweenRows: parseFloat(plantSpacingRows),
      spacingBetweenColumns: parseFloat(plantSpacingColumns),
      startingCorner: center,
      layer: plantLayer,
    };

    // Generate individual plants for this configuration
    const newPlants = [];
    const rows = parseInt(plantRows);
    const cols = parseInt(plantColumns);
    const spacingRows = parseFloat(plantSpacingRows);
    const spacingCols = parseFloat(plantSpacingColumns);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newPlants.push({
          id: `plant-${Date.now()}-${row}-${col}`,
          configId: newConfig.id,
          position: {
            x: center.x + (col * spacingCols * 3), // Convert feet to pixels (approximate)
            y: center.y + (row * spacingRows * 3),
          },
          layer: plantLayer,
        });
      }
    }

    updateFarm(farm.id, {
      plantConfigurations: [...farm.plantConfigurations, newConfig],
      plants: [...farm.plants, ...newPlants],
    });

    // Clear form and close modal
    setPlantConfigName('');
    setPlantType('');
    setPlantRows('');
    setPlantColumns('');
    setPlantSpacingRows('');
    setPlantSpacingColumns('');
    setPlantCategory('tree');
    setPlantLayer(1);
    setShowAddPlant(false);
  };

  const handleAddElement = () => {
    if (!farm || !elementName.trim()) return;

    const center = getFarmCenter();
    const newElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      name: elementName.trim(),
      quantity: elementQuantity ? parseInt(elementQuantity) : undefined,
      position: center,
      notes: elementNotes.trim() || undefined,
    };

    updateFarm(farm.id, {
      otherElements: [...farm.otherElements, newElement],
    });

    // Clear form and close modal
    setElementName('');
    setElementQuantity('');
    setElementNotes('');
    setElementType('well');
    setShowAddElement(false);
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
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  ✏️ Edit Farm
                </h2>

                {/* Add Elements Section */}
                <div className="mb-6 p-4 bg-farm-green-50 dark:bg-farm-green-900/20 border border-farm-green-500 rounded-lg">
                  <h3 className="text-lg font-semibold text-farm-green-800 dark:text-farm-green-300 mb-3">
                    ➕ Add Elements
                  </h3>
                  <p className="text-sm text-farm-green-700 dark:text-farm-green-400 mb-4">
                    Search and add buildings, plants, or other elements to your farm. Drag them to position on the grid.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAddBuilding(true)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-left flex items-center space-x-3 border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-2xl">🏠</span>
                      <span>Add Building</span>
                    </button>
                    <button
                      onClick={() => setShowAddPlant(true)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-left flex items-center space-x-3 border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-2xl">🌴</span>
                      <span>Add Plants/Trees</span>
                    </button>
                    <button
                      onClick={() => setShowAddElement(true)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-left flex items-center space-x-3 border border-gray-200 dark:border-gray-600"
                    >
                      <span className="text-2xl">💧</span>
                      <span>Add Other Elements</span>
                    </button>
                  </div>
                </div>

                {/* Edit Farm Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Farm Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Farm Name
                      </label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                    <button
                      onClick={handleUpdateFarmInfo}
                      className="w-full px-4 py-2 bg-farm-green-600 text-pearl rounded-lg hover:bg-farm-green-700 transition-colors font-semibold"
                    >
                      Update Information
                    </button>
                  </div>
                </div>

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

        {/* Add Building Modal */}
        <AnimatePresence>
          {showAddBuilding && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Add Building
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Building Type
                    </label>
                    <select
                      value={buildingType}
                      onChange={(e) => setBuildingType(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    >
                      <option value="house">House</option>
                      <option value="livestock-shed">Livestock Shed</option>
                      <option value="storage">Storage</option>
                      <option value="motor-room">Motor Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Building Name
                    </label>
                    <input
                      type="text"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      placeholder="e.g., Main House, Barn, etc."
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Width (cents)
                      </label>
                      <input
                        type="number"
                        value={buildingWidth}
                        onChange={(e) => setBuildingWidth(e.target.value)}
                        placeholder="10"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Height (cents)
                      </label>
                      <input
                        type="number"
                        value={buildingHeight}
                        onChange={(e) => setBuildingHeight(e.target.value)}
                        placeholder="10"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddBuilding(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddBuilding}
                    disabled={!buildingName.trim() || !buildingWidth || !buildingHeight}
                    className="flex-1 px-4 py-3 bg-farm-green-600 text-pearl rounded-lg hover:bg-farm-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Building
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Plant/Tree Modal */}
        <AnimatePresence>
          {showAddPlant && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Add Plants/Trees
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Configuration Name
                    </label>
                    <input
                      type="text"
                      value={plantConfigName}
                      onChange={(e) => setPlantConfigName(e.target.value)}
                      placeholder="e.g., Coconut Section A"
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={plantCategory}
                      onChange={(e) => setPlantCategory(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    >
                      <option value="tree">Tree</option>
                      <option value="plant">Plant</option>
                      <option value="crop">Crop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plant Type
                    </label>
                    <input
                      type="text"
                      value={plantType}
                      onChange={(e) => setPlantType(e.target.value)}
                      placeholder="e.g., Coconut, Mango, Pepper"
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rows
                      </label>
                      <input
                        type="number"
                        value={plantRows}
                        onChange={(e) => setPlantRows(e.target.value)}
                        placeholder="10"
                        min="1"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Columns
                      </label>
                      <input
                        type="number"
                        value={plantColumns}
                        onChange={(e) => setPlantColumns(e.target.value)}
                        placeholder="10"
                        min="1"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Row Spacing (ft)
                      </label>
                      <input
                        type="number"
                        value={plantSpacingRows}
                        onChange={(e) => setPlantSpacingRows(e.target.value)}
                        placeholder="20"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Column Spacing (ft)
                      </label>
                      <input
                        type="number"
                        value={plantSpacingColumns}
                        onChange={(e) => setPlantSpacingColumns(e.target.value)}
                        placeholder="20"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>
                  </div>
                  {farm?.farmingType === 'multilayer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Layer
                      </label>
                      <select
                        value={plantLayer}
                        onChange={(e) => setPlantLayer(parseInt(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      >
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((layer) => (
                          <option key={layer} value={layer}>
                            Layer {layer}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddPlant(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPlant}
                    disabled={
                      !plantConfigName.trim() ||
                      !plantType.trim() ||
                      !plantRows ||
                      !plantColumns ||
                      !plantSpacingRows ||
                      !plantSpacingColumns
                    }
                    className="flex-1 px-4 py-3 bg-farm-green-600 text-pearl rounded-lg hover:bg-farm-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Plants
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Add Other Element Modal */}
        <AnimatePresence>
          {showAddElement && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Add Other Element
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Element Type
                    </label>
                    <select
                      value={elementType}
                      onChange={(e) => setElementType(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    >
                      <option value="well">Well</option>
                      <option value="borewell">Borewell</option>
                      <option value="bee-box">Bee Box</option>
                      <option value="electricity-post">Electricity Post</option>
                      <option value="pit">Pit</option>
                      <option value="livestock">Livestock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={elementName}
                      onChange={(e) => setElementName(e.target.value)}
                      placeholder="e.g., Main Well, Honey Bees"
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity (optional)
                    </label>
                    <input
                      type="number"
                      value={elementQuantity}
                      onChange={(e) => setElementQuantity(e.target.value)}
                      placeholder="1"
                      min="1"
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={elementNotes}
                      onChange={(e) => setElementNotes(e.target.value)}
                      placeholder="Add any notes about this element..."
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddElement(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddElement}
                    disabled={!elementName.trim()}
                    className="flex-1 px-4 py-3 bg-farm-green-600 text-pearl rounded-lg hover:bg-farm-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Element
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
