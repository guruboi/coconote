import { motion } from 'framer-motion';
import { useFarmStore } from '@/stores/farmStore';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();
  const { farms, setCurrentFarm } = useFarmStore();
  const { user } = useUserStore();

  const handleAddFarm = () => {
    navigate('/farm/create');
  };

  const handleSelectFarm = (farmId: string) => {
    setCurrentFarm(farmId);
    navigate('/farm/view');
  };

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
                  onClick={() => handleSelectFarm(farm.id)}
                  className="bg-pearl dark:bg-bg-dark-alt p-6 rounded-xl shadow-lg cursor-pointer
                             border-2 border-transparent hover:border-farm-green-500 transition-all"
                >
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
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
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
