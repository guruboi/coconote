import { useFarmStore } from '@/stores/farmStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const FarmView = () => {
  const navigate = useNavigate();
  const { getCurrentFarm, viewState, setMode } = useFarmStore();
  const farm = getCurrentFarm();

  useEffect(() => {
    if (!farm) {
      navigate('/');
    }
  }, [farm, navigate]);

  if (!farm) return null;

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {farm.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{farm.description}</p>
        </div>

        {/* Mode selector */}
        <div className="flex gap-4 mb-6">
          {(['view', 'edit', 'pipeline', 'livestock'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                viewState.mode === mode
                  ? 'bg-farm-green-600 text-pearl'
                  : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 hover:bg-farm-green-100'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
            </button>
          ))}
        </div>

        {/* Farm canvas area - placeholder */}
        <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-8 min-h-[600px] flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            Farm View Canvas - Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
};
