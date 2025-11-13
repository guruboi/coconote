import { motion } from 'framer-motion';
import { useFarmStore } from '@/stores/farmStore';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const Home = () => {
  const navigate = useNavigate();
  const { farms, setCurrentFarm, deleteFarm, updateFarm } = useFarmStore();
  const { user } = useUserStore();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

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
                Your Farms
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map((farm, index) => (
                <motion.div
                  key={farm.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-pearl dark:bg-bg-dark-alt p-6 rounded-xl shadow-lg
                             border-2 border-transparent hover:border-farm-green-500 transition-all relative group"
                >
                  {/* Edit button - shows on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(farm);
                    }}
                    className="absolute top-4 right-14 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
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
                      setDeleteConfirmId(farm.id);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                               rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all
                               opacity-0 group-hover:opacity-100 flex items-center justify-center"
                    title="Delete farm"
                  >
                    🗑️
                  </button>

                  <div onClick={() => handleSelectFarm(farm.id)} className="cursor-pointer">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 pr-8">
                      {farm.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {farm.description || 'No description'}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {farm.boundary.area} acres
                      </span>
                      <span className="text-farm-green-600 font-semibold">
                        {farm.farmingType}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
