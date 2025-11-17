import { useFarmStore } from '@/stores/farmStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FarmRenderer } from '@/components/FarmRenderer';
import { ElementPalette } from '@/components/ElementPalette';
import type { Point } from '@/types/farm.types';

export const FarmView = () => {
  const navigate = useNavigate();
  const { getCurrentFarm, viewState, setMode, setSelectedLayer, deleteFarm, updateFarm } = useFarmStore();
  const farm = getCurrentFarm();

  const [showStats, setShowStats] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [draggingElement, setDraggingElement] = useState<any>(null);
  const [showEditFarmInfo, setShowEditFarmInfo] = useState(false);
  const [editFarmName, setEditFarmName] = useState('');
  const [editFarmDescription, setEditFarmDescription] = useState('');
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<Point[]>([]);
  const [showAddPlant, setShowAddPlant] = useState(false);
  const [plantForm, setPlantForm] = useState({
    name: '',
    category: 'tree' as 'tree' | 'plant' | 'crop',
    plantType: '',
    rows: 1,
    columns: 1,
    spacingRows: 10,
    spacingColumns: 10,
  });
  const [showAddLivestock, setShowAddLivestock] = useState(false);
  const [livestockForm, setLivestockForm] = useState({
    type: 'cow' as 'cow' | 'goat' | 'sheep' | 'chicken' | 'other',
    tag: '',
    age: 0,
    health: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
  });
  const [isDrawingPipeline, setIsDrawingPipeline] = useState(false);
  const [currentPipelinePoints, setCurrentPipelinePoints] = useState<Point[]>([]);
  const [pipelineType, setPipelineType] = useState<'irrigation' | 'underground'>('irrigation');
  const [selectedPathPoints, setSelectedPathPoints] = useState<{ pathId: string; indices: number[] }[]>([]);
  const [selectedPipelinePoints, setSelectedPipelinePoints] = useState<{ pipelineId: string; indices: number[] }[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [showPlantNotes, setShowPlantNotes] = useState(false);
  const [selectedPlantConfigId, setSelectedPlantConfigId] = useState<string | null>(null);

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

  const handleToggleBuildingLock = (buildingId: string) => {
    if (farm) {
      updateFarm(farm.id, {
        buildings: farm.buildings.map(b =>
          b.id === buildingId ? { ...b, locked: !b.locked } : b
        ),
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

  const handleOpenEditFarmInfo = () => {
    if (farm) {
      setEditFarmName(farm.name);
      setEditFarmDescription(farm.description || '');
      setShowEditFarmInfo(true);
    }
  };

  const handleSaveFarmInfo = () => {
    if (farm && editFarmName.trim()) {
      updateFarm(farm.id, {
        name: editFarmName.trim(),
        description: editFarmDescription.trim(),
      });
      setShowEditFarmInfo(false);
    }
  };

  const handleStartDrawingPath = () => {
    // If a point is selected, start from that point
    if (selectedPathPoints.length > 0) {
      const selection = selectedPathPoints[0];
      const path = farm?.otherElements.find(e => e.id === selection.pathId && e.type === 'path');
      if (path && path.points) {
        // Get the selected point (use the first selected index)
        const selectedIndex = selection.indices[0];
        const selectedPoint = path.points[selectedIndex];
        setCurrentPathPoints([selectedPoint]);
      }
    } else {
      setCurrentPathPoints([]);
    }
    setIsDrawingPath(true);
    setDraggingElement(null);
    setSelectedPathPoints([]); // Clear selection when starting to draw
  };

  const handleCancelDrawingPath = () => {
    setIsDrawingPath(false);
    setCurrentPathPoints([]);
  };

  const handleAddPathPoint = (point: Point) => {
    if (isDrawingPath) {
      setCurrentPathPoints(prev => [...prev, point]);
    }
  };

  const handleFinishDrawingPath = () => {
    if (farm && currentPathPoints.length >= 2) {
      const newPath = {
        id: Date.now().toString(),
        type: 'path' as const,
        name: `Path ${farm.otherElements.filter(e => e.type === 'path').length + 1}`,
        position: currentPathPoints[0], // First point as reference position
        points: currentPathPoints,
      };
      updateFarm(farm.id, {
        otherElements: [...farm.otherElements, newPath],
      });
    }
    setIsDrawingPath(false);
    setCurrentPathPoints([]);
  };

  const handleDeleteSelectedPathPoints = () => {
    if (!farm || selectedPathPoints.length === 0) return;

    const updatedElements = farm.otherElements.map(element => {
      if (element.type === 'path' && element.points) {
        const selection = selectedPathPoints.find(s => s.pathId === element.id);
        if (selection) {
          // Remove selected points from this path
          const newPoints = element.points.filter((_, index) => !selection.indices.includes(index));
          // If less than 2 points remain, mark path for removal
          if (newPoints.length < 2) {
            return null; // Will be filtered out
          }
          return { ...element, points: newPoints };
        }
      }
      return element;
    }).filter(Boolean) as typeof farm.otherElements; // Remove null entries

    updateFarm(farm.id, {
      otherElements: updatedElements,
    });

    // Clear selection
    setSelectedPathPoints([]);
  };

  const handleAddPlantConfig = () => {
    if (farm && plantForm.name.trim() && plantForm.plantType.trim()) {
      // Calculate area needed for this plant configuration
      const totalPlants = plantForm.rows * plantForm.columns;
      const configWidth = plantForm.columns * plantForm.spacingColumns; // in feet
      const configHeight = plantForm.rows * plantForm.spacingRows; // in feet
      const configAreaSqFt = configWidth * configHeight;
      const configAreaCents = configAreaSqFt / 435.6;

      // Calculate total farm area in square feet
      const farmAreaSqFt = farm.boundary.area * 43560; // acres to sq ft
      const farmAreaCents = farm.boundary.area * 100; // acres to cents

      // Calculate already used area
      let usedAreaSqFt = 0;

      // Add building areas
      farm.buildings.forEach(building => {
        const buildingSqFt = building.size.width * building.size.height * 435.6;
        usedAreaSqFt += buildingSqFt;
      });

      // Add existing plant configuration areas
      farm.plantConfigurations.forEach(config => {
        const configSqFt = config.rows * config.spacingBetweenRows * config.columns * config.spacingBetweenColumns;
        usedAreaSqFt += configSqFt;
      });

      const usedAreaCents = usedAreaSqFt / 435.6;
      const availableAreaSqFt = farmAreaSqFt - usedAreaSqFt;
      const availableAreaCents = farmAreaCents - usedAreaCents;

      // Check if configuration fits
      if (configAreaSqFt > availableAreaSqFt) {
        alert(
          `Cannot add plant configuration!\n\n` +
          `Configuration needs: ${totalPlants} plants in ${configAreaSqFt.toFixed(0)} sq ft (${configAreaCents.toFixed(2)} cents)\n` +
          `Available space: ${availableAreaSqFt.toFixed(0)} sq ft (${availableAreaCents.toFixed(2)} cents)\n\n` +
          `Please reduce the number of plants or adjust spacing.`
        );
        return;
      }

      const newConfig = {
        id: Date.now().toString(),
        name: plantForm.name.trim(),
        category: plantForm.category,
        plantType: plantForm.plantType.trim(),
        rows: plantForm.rows,
        columns: plantForm.columns,
        spacingBetweenRows: plantForm.spacingRows,
        spacingBetweenColumns: plantForm.spacingColumns,
        startingCorner: 'center' as const,
        layer: viewState.selectedLayer || 1,
      };
      updateFarm(farm.id, {
        plantConfigurations: [...farm.plantConfigurations, newConfig],
      });
      setShowAddPlant(false);
      setPlantForm({
        name: '',
        category: 'tree',
        plantType: '',
        rows: 1,
        columns: 1,
        spacingRows: 10,
        spacingColumns: 10,
      });
    }
  };

  const handleAddLivestock = () => {
    if (farm && livestockForm.tag.trim()) {
      const newLivestock = {
        id: Date.now().toString(),
        type: livestockForm.type,
        tag: livestockForm.tag.trim(),
        age: livestockForm.age,
        health: livestockForm.health,
      };
      updateFarm(farm.id, {
        livestock: [...farm.livestock, newLivestock],
      });
      setShowAddLivestock(false);
      setLivestockForm({
        type: 'cow',
        tag: '',
        age: 0,
        health: 'good',
      });
    }
  };

  const handleDeleteLivestock = (livestockId: string) => {
    if (farm) {
      updateFarm(farm.id, {
        livestock: farm.livestock.filter(l => l.id !== livestockId),
      });
    }
  };

  const handleStartDrawingPipeline = () => {
    // If a pipeline point is selected, start from that point
    if (selectedPipelinePoints.length > 0) {
      const selection = selectedPipelinePoints[0];
      const pipeline = farm?.pipelines.find(p => p.id === selection.pipelineId);
      if (pipeline && pipeline.points) {
        // Get the selected point (use the first selected index)
        const selectedIndex = selection.indices[0];
        const selectedPoint = pipeline.points[selectedIndex];
        setCurrentPipelinePoints([selectedPoint]);
      }
    } else {
      setCurrentPipelinePoints([]);
    }
    setIsDrawingPipeline(true);
    setSelectedPipelinePoints([]); // Clear selection when starting to draw
  };

  const handleCancelDrawingPipeline = () => {
    setIsDrawingPipeline(false);
    setCurrentPipelinePoints([]);
  };

  const handleAddPipelinePoint = (point: Point) => {
    if (isDrawingPipeline) {
      setCurrentPipelinePoints(prev => [...prev, point]);
    }
  };

  const handleFinishDrawingPipeline = () => {
    if (farm && currentPipelinePoints.length >= 2) {
      const newPipeline = {
        id: Date.now().toString(),
        points: currentPipelinePoints,
        type: pipelineType,
        layer: viewState.selectedLayer || 1,
      };
      updateFarm(farm.id, {
        pipelines: [...farm.pipelines, newPipeline],
      });
    }
    setIsDrawingPipeline(false);
    setCurrentPipelinePoints([]);
  };

  const handleDeletePipeline = (pipelineId: string) => {
    if (farm) {
      updateFarm(farm.id, {
        pipelines: farm.pipelines.filter(p => p.id !== pipelineId),
      });
    }
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
          {(['view', 'edit', 'pipeline', 'livestock', 'notes'] as const).map((mode) => (
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
            onClick={() => setShowStats(!showStats)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showStats
                ? 'bg-farm-green-600 text-pearl'
                : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300'
            }`}
          >
            {showStats ? '✓' : '○'} Stats
          </button>

          {/* Path Drawing Controls - Only in Edit Mode */}
          {viewState.mode === 'edit' && !isDrawingPipeline && (
            <>
              {!isDrawingPath ? (
                <button
                  onClick={handleStartDrawingPath}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🛤️ Draw Path
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFinishDrawingPath}
                    disabled={currentPathPoints.length < 2}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPathPoints.length >= 2
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    ✓ Finish Path ({currentPathPoints.length} points)
                  </button>
                  <button
                    onClick={handleCancelDrawingPath}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
              {!isDrawingPath && selectedPathPoints.length > 0 && (
                <button
                  onClick={handleDeleteSelectedPathPoints}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🗑️ Delete Selected ({selectedPathPoints.reduce((sum, s) => sum + s.indices.length, 0)} points)
                </button>
              )}
            </>
          )}

          {/* Pipeline Drawing Controls - Only in Pipeline Mode */}
          {viewState.mode === 'pipeline' && (
            <>
              <select
                value={pipelineType}
                onChange={(e) => setPipelineType(e.target.value as any)}
                className="px-4 py-2 rounded-lg bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
              >
                <option value="irrigation">💧 Irrigation</option>
                <option value="underground">🕳️ Underground</option>
              </select>
              {!isDrawingPipeline ? (
                <button
                  onClick={handleStartDrawingPipeline}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🚰 Draw Pipeline
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFinishDrawingPipeline}
                    disabled={currentPipelinePoints.length < 2}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPipelinePoints.length >= 2
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    ✓ Finish Pipeline ({currentPipelinePoints.length} points)
                  </button>
                  <button
                    onClick={handleCancelDrawingPipeline}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
            </>
          )}
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
            currentLayer={viewState.selectedLayer}
            isEditMode={viewState.mode === 'edit'}
            draggingElement={draggingElement}
            isDrawingPath={isDrawingPath}
            currentPathPoints={currentPathPoints}
            onAddPathPoint={handleAddPathPoint}
            isDrawingPipeline={isDrawingPipeline}
            currentPipelinePoints={currentPipelinePoints}
            onAddPipelinePoint={handleAddPipelinePoint}
            pipelineType={pipelineType}
            selectedPathPoints={selectedPathPoints}
            onSelectedPathPointsChange={setSelectedPathPoints}
            selectedPipelinePoints={selectedPipelinePoints}
            onSelectedPipelinePointsChange={setSelectedPipelinePoints}
            onBuildingClick={setSelectedBuildingId}
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

        {/* Edit Farm Info Dialog */}
        {showEditFarmInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                ✏️ Edit Farm Info
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={editFarmName}
                    onChange={(e) => setEditFarmName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    placeholder="Enter farm name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editFarmDescription}
                    onChange={(e) => setEditFarmDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    placeholder="Enter farm description"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditFarmInfo(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFarmInfo}
                  className="flex-1 px-4 py-3 bg-farm-green-600 text-white rounded-lg hover:bg-farm-green-700 transition-colors font-semibold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Plant Configuration Modal */}
        {showAddPlant && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-lg w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                🌱 Add Plant Configuration
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Configuration Name
                  </label>
                  <input
                    type="text"
                    value={plantForm.name}
                    onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    placeholder="e.g., Coconut Grove A"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={plantForm.category}
                      onChange={(e) => setPlantForm({ ...plantForm, category: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    >
                      <option value="tree">🌴 Tree</option>
                      <option value="plant">🌿 Plant</option>
                      <option value="crop">🌾 Crop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Plant Type
                    </label>
                    <input
                      type="text"
                      value={plantForm.plantType}
                      onChange={(e) => setPlantForm({ ...plantForm, plantType: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      placeholder="e.g., Coconut"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rows
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={plantForm.rows}
                      onChange={(e) => setPlantForm({ ...plantForm, rows: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Columns
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={plantForm.columns}
                      onChange={(e) => setPlantForm({ ...plantForm, columns: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
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
                      min="1"
                      value={plantForm.spacingRows}
                      onChange={(e) => setPlantForm({ ...plantForm, spacingRows: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Column Spacing (ft)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={plantForm.spacingColumns}
                      onChange={(e) => setPlantForm({ ...plantForm, spacingColumns: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Total plants: <strong>{plantForm.rows * plantForm.columns}</strong>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddPlant(false);
                    setPlantForm({
                      name: '',
                      category: 'tree',
                      plantType: '',
                      rows: 1,
                      columns: 1,
                      spacingRows: 10,
                      spacingColumns: 10,
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPlantConfig}
                  disabled={!plantForm.name.trim() || !plantForm.plantType.trim()}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                    plantForm.name.trim() && plantForm.plantType.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  Add Plants
                </button>
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
              className="fixed right-0 top-28 h-[calc(100vh-7rem)] w-96 bg-pearl dark:bg-bg-dark-alt shadow-2xl z-40 overflow-y-auto pt-4"
            >
              <ElementPalette
                onDragStart={handleElementDragStart}
                farmName={farm.name}
                farmDescription={farm.description}
                onEditFarmInfo={handleOpenEditFarmInfo}
              />

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
                            {building.locked && (
                              <span className="text-xs" title="Locked">🔒</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleBuildingLock(building.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                building.locked
                                  ? 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={building.locked ? 'Unlock building' : 'Lock building'}
                            >
                              {building.locked ? '🔓' : '🔒'}
                            </button>
                            <button
                              onClick={() => handleDeleteBuilding(building.id)}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete building"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plant Configurations */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Plant Configurations ({farm.plantConfigurations.length})
                    </h3>
                    <button
                      onClick={() => setShowAddPlant(true)}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      + Add Plants
                    </button>
                  </div>
                  {farm.plantConfigurations.length > 0 && (
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedPlantConfigId(config.id);
                                setShowPlantNotes(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="View/edit notes"
                            >
                              📝
                            </button>
                            <button
                              onClick={() => handleDeletePlantConfig(config.id)}
                              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete configuration"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Paths */}
                {farm.otherElements.filter(e => e.type === 'path').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Paths ({farm.otherElements.filter(e => e.type === 'path').length})
                    </h3>
                    <div className="space-y-2">
                      {farm.otherElements.filter(e => e.type === 'path').map((path) => (
                        <div
                          key={path.id}
                          className="flex items-center justify-between p-3 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🛤️</span>
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {path.name}
                              </div>
                              {path.points && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {path.points.length} points
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteElement(path.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete path"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Elements */}
                {farm.otherElements.filter(e => e.type !== 'path').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Other Elements ({farm.otherElements.filter(e => e.type !== 'path').length})
                    </h3>
                    <div className="space-y-2">
                      {farm.otherElements.filter(e => e.type !== 'path').map((element) => (
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
                    🎯 Edit Mode Guide
                  </p>
                  <ul className="text-sm text-farm-green-700 dark:text-farm-green-400 space-y-1">
                    <li>• Drag and drop elements from the palette to your farm</li>
                    <li>• Click and drag existing elements to reposition them</li>
                    <li>• Click "Draw Path" to create paths by clicking points on the farm</li>
                    <li>• Delete elements using the 🗑️ button next to each item</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Livestock Mode Panel */}
          {viewState.mode === 'livestock' && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-28 h-[calc(100vh-7rem)] w-96 bg-pearl dark:bg-bg-dark-alt shadow-2xl z-40 overflow-y-auto pt-4"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  🐄 Livestock Management
                </h2>

                {/* Add Livestock Button */}
                <button
                  onClick={() => setShowAddLivestock(true)}
                  className="w-full mb-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  + Add Livestock
                </button>

                {/* Livestock List */}
                {farm.livestock.length > 0 ? (
                  <div className="space-y-4">
                    {farm.livestock.map((animal) => (
                      <div
                        key={animal.id}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {animal.type === 'cow' ? '🐄' :
                               animal.type === 'goat' ? '🐐' :
                               animal.type === 'sheep' ? '🐑' :
                               animal.type === 'chicken' ? '🐔' : '🐾'}
                            </span>
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-gray-100">
                                Tag: {animal.tag}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {animal.type}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteLivestock(animal.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete livestock"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Age:</span>{' '}
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                              {animal.age || 0} years
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Health:</span>{' '}
                            <span className={`font-medium ${
                              animal.health === 'excellent' ? 'text-green-600' :
                              animal.health === 'good' ? 'text-blue-600' :
                              animal.health === 'fair' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {animal.health}
                            </span>
                          </div>
                        </div>
                        {animal.notes && animal.notes.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <strong>Notes:</strong> {animal.notes[animal.notes.length - 1]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🐄</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      No livestock added yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Click the button above to add your first animal
                    </p>
                  </div>
                )}

                {/* Livestock Summary */}
                {farm.livestock.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                      Summary
                    </h3>
                    <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      <div>Total livestock: <strong>{farm.livestock.length}</strong></div>
                      <div>Cows: <strong>{farm.livestock.filter(l => l.type === 'cow').length}</strong></div>
                      <div>Goats: <strong>{farm.livestock.filter(l => l.type === 'goat').length}</strong></div>
                      <div>Sheep: <strong>{farm.livestock.filter(l => l.type === 'sheep').length}</strong></div>
                      <div>Chickens: <strong>{farm.livestock.filter(l => l.type === 'chicken').length}</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Notes Mode Panel */}
          {viewState.mode === 'notes' && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-28 h-[calc(100vh-7rem)] w-96 bg-pearl dark:bg-bg-dark-alt shadow-2xl z-40 overflow-y-auto pt-4"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  📝 Farm Notes & Journal
                </h2>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Track daily activities, observations, and important farm events.
                </p>

                {/* Notes List */}
                {farm.farmNotes.length > 0 ? (
                  <div className="space-y-4">
                    {farm.farmNotes.slice().reverse().map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              {new Date(note.date).toLocaleDateString()} - {note.type}
                            </div>
                            <p className="text-gray-800 dark:text-gray-100">{note.description}</p>
                          </div>
                        </div>
                        {note.cost && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Cost: ₹{note.cost}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">📝</div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No notes yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start tracking your farm activities
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-500 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2">
                    💡 Note Taking Tips
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Record daily observations</li>
                    <li>• Track expenses and materials used</li>
                    <li>• Note weather conditions</li>
                    <li>• Document pest or disease issues</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pipeline Mode Panel */}
          {viewState.mode === 'pipeline' && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-28 h-[calc(100vh-7rem)] w-96 bg-pearl dark:bg-bg-dark-alt shadow-2xl z-40 overflow-y-auto pt-4"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  🚰 Pipeline Management
                </h2>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Use the controls above to draw irrigation or underground pipelines on your farm.
                </p>

                {/* Pipelines List */}
                {farm.pipelines.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                      Pipelines ({farm.pipelines.length})
                    </h3>
                    {farm.pipelines.map((pipeline) => (
                      <div
                        key={pipeline.id}
                        className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                              {pipeline.type === 'irrigation' ? '💧' : '🕳️'} {pipeline.type} Pipeline
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {pipeline.points?.length || 0} connection points
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePipeline(pipeline.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Delete pipeline"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🚰</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      No pipelines added yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Use the "Draw Pipeline" button above to add irrigation systems
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    💡 Tips
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Click points on the farm to draw pipeline routes</li>
                    <li>• Irrigation pipelines shown in blue</li>
                    <li>• Underground pipelines shown dashed in brown</li>
                    <li>• Minimum 2 points required to create a pipeline</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Livestock Modal */}
        {showAddLivestock && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                🐄 Add Livestock
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Animal Type
                  </label>
                  <select
                    value={livestockForm.type}
                    onChange={(e) => setLivestockForm({ ...livestockForm, type: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                  >
                    <option value="cow">🐄 Cow</option>
                    <option value="goat">🐐 Goat</option>
                    <option value="sheep">🐑 Sheep</option>
                    <option value="chicken">🐔 Chicken</option>
                    <option value="other">🐾 Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tag/ID Number
                  </label>
                  <input
                    type="text"
                    value={livestockForm.tag}
                    onChange={(e) => setLivestockForm({ ...livestockForm, tag: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    placeholder="e.g., COW001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={livestockForm.age}
                      onChange={(e) => setLivestockForm({ ...livestockForm, age: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Health Status
                    </label>
                    <select
                      value={livestockForm.health}
                      onChange={(e) => setLivestockForm({ ...livestockForm, health: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddLivestock(false);
                    setLivestockForm({
                      type: 'cow',
                      tag: '',
                      age: 0,
                      health: 'good',
                    });
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLivestock}
                  disabled={!livestockForm.tag.trim()}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors font-semibold ${
                    livestockForm.tag.trim()
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  Add Animal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Building Interior Modal */}
        {selectedBuildingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              {(() => {
                const building = farm.buildings.find(b => b.id === selectedBuildingId);
                if (!building) return null;

                const getBuildingIcon = (type: string) => {
                  const icons: Record<string, string> = {
                    'house': '🏠',
                    'livestock-shed': '🐄',
                    'storage': '📦',
                    'motor-room': '⚡',
                  };
                  return icons[type] || '🏗️';
                };

                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <span className="text-4xl">{getBuildingIcon(building.type)}</span>
                        {building.name}
                      </h2>
                      <button
                        onClick={() => setSelectedBuildingId(null)}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {building.type === 'house' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🛠️ Tools & Equipment</h3>
                        <div className="space-y-2">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Farming tools inventory</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Tool tracking feature coming soon...</p>
                        </div>
                      </div>
                    )}

                    {building.type === 'livestock-shed' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🐄 Livestock Inside</h3>
                        {farm.livestock.length > 0 ? (
                          <div className="space-y-3">
                            {farm.livestock.map(animal => (
                              <div key={animal.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-semibold text-gray-800 dark:text-gray-100">
                                      {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} - {animal.tag}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      Age: {animal.age || 'Unknown'} years
                                    </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    animal.health === 'excellent' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                    animal.health === 'good' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                    animal.health === 'fair' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                                    'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  }`}>
                                    {animal.health.charAt(0).toUpperCase() + animal.health.slice(1)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No livestock in shed</p>
                        )}
                      </div>
                    )}

                    {building.type === 'storage' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">📦 Stored Items</h3>
                        <div className="space-y-2">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Inventory management</span>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Storage tracking feature coming soon...</p>
                        </div>
                      </div>
                    )}

                    {building.type === 'motor-room' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">⚡ Equipment Status</h3>
                        <div className="space-y-3">
                          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-300">Motor Pump</span>
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">Operational</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Equipment monitoring feature coming soon...</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Size:</strong> {building.size.width} × {building.size.height} cents ({(building.size.width * building.size.height * 435.6).toFixed(0)} sq ft)</p>
                        <p className="mt-1"><strong>Direction:</strong> {building.direction.charAt(0).toUpperCase() + building.direction.slice(1)}</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}

        {/* Plant Notes Modal */}
        {showPlantNotes && selectedPlantConfigId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {(() => {
                const config = farm.plantConfigurations.find(c => c.id === selectedPlantConfigId);
                if (!config) return null;

                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        📝 Plant Notes
                      </h2>
                      <button
                        onClick={() => {
                          setShowPlantNotes(false);
                          setSelectedPlantConfigId(null);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">
                            {config.category === 'tree' ? '🌴' : config.category === 'plant' ? '🌿' : '🌾'}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{config.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {config.plantType} • {config.rows}×{config.columns} = {config.rows * config.columns} plants
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Planting Date
                        </label>
                        <input
                          type="date"
                          value={config.plantingDate || ''}
                          onChange={(e) => {
                            updateFarm(farm.id, {
                              plantConfigurations: farm.plantConfigurations.map(c =>
                                c.id === selectedPlantConfigId
                                  ? { ...c, plantingDate: e.target.value }
                                  : c
                              ),
                            });
                          }}
                          className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                        />
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <strong>Grid Information:</strong>
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• Row spacing: {config.spacingBetweenRows} ft</li>
                          <li>• Column spacing: {config.spacingBetweenColumns} ft</li>
                          <li>• Total plants: {config.rows * config.columns}</li>
                          <li>• Layer: {config.layer}</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>ℹ️ Individual Plant Notes:</strong> The PlantNotes feature for tracking health,
                          manuring, and diseases for individual plants will be added in the next update. For now,
                          you can use the Farm Notes feature to track maintenance activities.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setShowPlantNotes(false);
                          setSelectedPlantConfigId(null);
                        }}
                        className="px-6 py-2 bg-farm-green-600 text-white rounded-lg hover:bg-farm-green-700 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
