import { useNavigate } from 'react-router-dom';

export const FarmCreate = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Create New Farm
          </h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>

        <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-8">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Farm creation form - Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
};
