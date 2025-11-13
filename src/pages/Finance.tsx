import { motion } from 'framer-motion';
import { useFinanceStore } from '@/stores/financeStore';

export const Finance = () => {
  const { getTotalExpense, getTotalIncome, getNetProfit } = useFinanceStore();

  const totalExpense = getTotalExpense();
  const totalIncome = getTotalIncome();
  const netProfit = getNetProfit();

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          Finance
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pearl dark:bg-bg-dark-alt p-6 rounded-xl shadow-lg"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Expense</p>
            <p className="text-3xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-pearl dark:bg-bg-dark-alt p-6 rounded-xl shadow-lg"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Income</p>
            <p className="text-3xl font-bold text-farm-green-600">₹{totalIncome.toLocaleString()}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-pearl dark:bg-bg-dark-alt p-6 rounded-xl shadow-lg"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Net Profit</p>
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-farm-green-600' : 'text-red-600'}`}>
              ₹{netProfit.toLocaleString()}
            </p>
          </motion.div>
        </div>

        {/* Placeholder for detailed finance view */}
        <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-8">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Detailed finance tracking - Coming Soon
          </p>
        </div>
      </div>
    </div>
  );
};
