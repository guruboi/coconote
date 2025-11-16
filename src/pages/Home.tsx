import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useFarmStore } from '@/stores/farmStore';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export const Home = () => {
  const navigate = useNavigate();
  const { farms, setCurrentFarm, deleteFarm, updateFarm } = useFarmStore();
  const { user } = useUserStore();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddFarm = () => {
    navigate('/farm/create');
  };

  const handleSelectFarm = (farmId: string) => {
    setCurrentFarm(farmId);
    navigate('/farm/view');
  };

  const handleDeleteFarm = (farmId: string) => {
    deleteFarm(farmId);
    setDeleteConfirmId(null);
  };

  const handleStartEdit = (farm: any) => {
    setEditingFarmId(farm.id);
    setEditName(farm.name);
    setEditDescription(farm.description || '');
  };

  const handleSaveEdit = () => {
    if (editingFarmId && editName.trim()) {
      updateFarm(editingFarmId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setEditingFarmId(null);
    }
  };

  // Auto-scroll carousel
  useEffect(() => {
    if (farms.length <= 1 || isPaused) {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
      return;
    }

    autoScrollIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % farms.length);
    }, 4000); // Auto-scroll every 4 seconds

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [farms.length, isPaused]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + farms.length) % farms.length);
    setIsPaused(true); // Pause auto-scroll when user manually navigates
    setTimeout(() => setIsPaused(false), 8000); // Resume after 8 seconds
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % farms.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  };

  const farmToDelete = farms.find(f => f.id === deleteConfirmId);
  const editingFarm = farms.find(f => f.id === editingFarmId);

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {farms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Hey {user?.name || 'Guru'}, add your farm to manage!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
              Start by creating your first farm. You can add details about your land,
              crops, livestock, and more.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddFarm}
              className="px-8 py-4 bg-farm-green-600 hover:bg-farm-green-700 text-pearl rounded-lg
                         font-semibold shadow-lg transition-colors"
            >
              + Add Your First Farm
            </motion.button>
          </motion.div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Your Farms ({farms.length})
              </h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddFarm}
                className="px-6 py-3 bg-farm-green-600 hover:bg-farm-green-700 text-pearl
                           rounded-lg font-semibold shadow-md transition-colors"
              >
                + Add Farm
              </motion.button>
            </div>

            {/* Farm Carousel */}
            <div
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Navigation Buttons */}
              {farms.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12
                               bg-pearl dark:bg-bg-dark-alt rounded-full shadow-lg flex items-center justify-center
                               text-gray-700 dark:text-gray-300 hover:bg-farm-green-100 dark:hover:bg-farm-green-900/30
                               transition-all hover:scale-110"
                    aria-label="Previous farm"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12
                               bg-pearl dark:bg-bg-dark-alt rounded-full shadow-lg flex items-center justify-center
                               text-gray-700 dark:text-gray-300 hover:bg-farm-green-100 dark:hover:bg-farm-green-900/30
                               transition-all hover:scale-110"
                    aria-label="Next farm"
                  >
                    →
                  </button>
                </>
              )}

              {/* Carousel Container */}
              <div className="overflow-hidden rounded-2xl">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                      opacity: { duration: 0.2 }
                    }}
                    className="bg-pearl dark:bg-bg-dark-alt p-8 rounded-2xl shadow-2xl
                               border-2 border-transparent hover:border-farm-green-500 transition-all relative group"
                  >
                    {/* Edit button - shows on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(farms[currentIndex]);
                      }}
                      className="absolute top-6 right-20 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
                                 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all
                                 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      title="Edit farm name and description"
                    >
                      ✏️
                    </button>

                    {/* Delete button - shows on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(farms[currentIndex].id);
                      }}
                      className="absolute top-6 right-6 w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                                 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all
                                 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      title="Delete farm"
                    >
                      🗑️
                    </button>

                    <div onClick={() => handleSelectFarm(farms[currentIndex].id)} className="cursor-pointer">
                      <div className="flex items-start gap-6">
                        {/* Farm Icon */}
                        <div className="text-7xl">🌾</div>

                        {/* Farm Details */}
                        <div className="flex-1">
                          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3 pr-16">
                            {farms[currentIndex].name}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 max-w-2xl">
                            {farms[currentIndex].description || 'No description provided'}
                          </p>

                          {/* Farm Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-frost dark:bg-bg-dark p-4 rounded-lg">
                              <div className="text-2xl mb-1">📐</div>
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {farms[currentIndex].boundary.area}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Acres</div>
                            </div>

                            <div className="bg-frost dark:bg-bg-dark p-4 rounded-lg">
                              <div className="text-2xl mb-1">🏗️</div>
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {farms[currentIndex].buildings.length}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Buildings</div>
                            </div>

                            <div className="bg-frost dark:bg-bg-dark p-4 rounded-lg">
                              <div className="text-2xl mb-1">🌳</div>
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {farms[currentIndex].plantConfigurations.reduce((sum, config) => sum + (config.rows * config.columns), 0)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Plants</div>
                            </div>

                            <div className="bg-frost dark:bg-bg-dark p-4 rounded-lg">
                              <div className="text-2xl mb-1">🌱</div>
                              <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 capitalize">
                                {farms[currentIndex].farmingType}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                            </div>
                          </div>

                          <div className="mt-6 flex gap-3">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectFarm(farms[currentIndex].id);
                              }}
                              className="px-6 py-3 bg-farm-green-600 hover:bg-farm-green-700 text-pearl
                                         rounded-lg font-semibold shadow-md transition-colors"
                            >
                              Open Farm →
                            </motion.button>
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              Click to manage this farm
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Carousel Indicators */}
              {farms.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {farms.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsPaused(true);
                        setTimeout(() => setIsPaused(false), 8000);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-8 bg-farm-green-600'
                          : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-farm-green-400'
                      }`}
                      aria-label={`Go to farm ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Grid View Toggle (optional - shows all farms in grid) */}
            {farms.length > 1 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">All Farms</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {farms.map((farm, index) => (
                    <motion.div
                      key={farm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -2, scale: 1.02 }}
                      onClick={() => {
                        setCurrentIndex(index);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`bg-pearl dark:bg-bg-dark-alt p-4 rounded-lg shadow cursor-pointer
                                 border-2 transition-all ${
                        index === currentIndex
                          ? 'border-farm-green-500'
                          : 'border-transparent hover:border-farm-green-300'
                      }`}
                    >
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {farm.name}
                      </h3>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{farm.boundary.area} acres</span>
                        <span className="capitalize">{farm.farmingType}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && farmToDelete && (
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
                  Are you sure you want to delete <strong>{farmToDelete.name}</strong>? This action cannot be undone. All farm data including buildings, plants, and configurations will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteFarm(deleteConfirmId)}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    Delete Farm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Farm Dialog */}
        {editingFarmId && editingFarm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">✏️</div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Edit Farm
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Farm Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingFarmId(null)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className="flex-1 px-4 py-3 bg-farm-green-600 text-white rounded-lg hover:bg-farm-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
