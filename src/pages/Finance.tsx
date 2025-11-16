import { motion, AnimatePresence } from 'framer-motion';
import { useFinanceStore } from '@/stores/financeStore';
import { useFarmStore } from '@/stores/farmStore';
import { useState } from 'react';

type TransactionType = 'expense' | 'income';
type ExpenseCategory = 'seeds' | 'fertilizer' | 'pesticide' | 'labor' | 'equipment' | 'water' | 'electricity' | 'other';
type IncomeCategory = 'harvest' | 'livestock' | 'other';

export const Finance = () => {
  const {
    expenses,
    incomes,
    getTotalExpense,
    getTotalIncome,
    getNetProfit,
    addExpense,
    addIncome,
    deleteExpense,
    deleteIncome
  } = useFinanceStore();
  const { farms } = useFarmStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');

  // Form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>('seeds');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [farmId, setFarmId] = useState<string>('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [overviewPeriod, setOverviewPeriod] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const totalExpense = getTotalExpense();
  const totalIncome = getTotalIncome();
  const netProfit = getNetProfit();

  const handleAddTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (transactionType === 'expense') {
      addExpense({
        id: Date.now().toString(),
        farmId: farmId || undefined,
        date: new Date(date),
        category: category as ExpenseCategory,
        amount: parseFloat(amount),
        description
      });
    } else {
      addIncome({
        id: Date.now().toString(),
        farmId: farmId || undefined,
        date: new Date(date),
        source: category as IncomeCategory,
        amount: parseFloat(amount),
        description
      });
    }

    // Reset form
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setFarmId('');
    setShowAddModal(false);
  };

  const openAddModal = (type: TransactionType) => {
    setTransactionType(type);
    setCategory(type === 'expense' ? 'seeds' : 'harvest');
    setShowAddModal(true);
  };

  const filteredExpenses = expenses.filter(e =>
    selectedFarm === 'all' || e.farmId === selectedFarm
  );

  const filteredIncomes = incomes.filter(i =>
    selectedFarm === 'all' || i.farmId === selectedFarm
  );

  const expenseCategories: ExpenseCategory[] = ['seeds', 'fertilizer', 'pesticide', 'labor', 'equipment', 'water', 'electricity', 'other'];
  const incomeCategories: IncomeCategory[] = ['harvest', 'livestock', 'other'];

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      seeds: '🌱',
      fertilizer: '🧪',
      pesticide: '🦟',
      labor: '👷',
      equipment: '🔧',
      water: '💧',
      electricity: '⚡',
      harvest: '🌾',
      livestock: '🐄',
      other: '📝'
    };
    return icons[cat] || '💰';
  };

  // Calculator function - evaluates BODMAS expressions
  const calculateExpression = (expr: string) => {
    try {
      // Remove whitespace
      const cleaned = expr.replace(/\s/g, '');
      // Basic validation to prevent code injection
      if (!/^[0-9+\-*/().]+$/.test(cleaned)) {
        throw new Error('Invalid characters');
      }
      // Use Function constructor for safe evaluation (still be cautious!)
      const result = Function('"use strict"; return (' + cleaned + ')')();
      if (typeof result === 'number' && !isNaN(result)) {
        setCalcResult(result);
      } else {
        setCalcResult(null);
      }
    } catch (e) {
      setCalcResult(null);
    }
  };

  // Get filtered transactions by period
  const getTransactionsByPeriod = () => {
    const filtered = {
      expenses: expenses.filter(e => {
        const eDate = new Date(e.date);
        if (overviewPeriod === 'month') {
          return eDate.getMonth() === selectedMonth && eDate.getFullYear() === selectedYear;
        } else {
          return eDate.getFullYear() === selectedYear;
        }
      }),
      incomes: incomes.filter(i => {
        const iDate = new Date(i.date);
        if (overviewPeriod === 'month') {
          return iDate.getMonth() === selectedMonth && iDate.getFullYear() === selectedYear;
        } else {
          return iDate.getFullYear() === selectedYear;
        }
      })
    };

    const periodExpense = filtered.expenses.reduce((sum, e) => sum + e.amount, 0);
    const periodIncome = filtered.incomes.reduce((sum, i) => sum + i.amount, 0);

    return {
      ...filtered,
      totalExpense: periodExpense,
      totalIncome: periodIncome,
      netProfit: periodIncome - periodExpense
    };
  };

  const periodData = getTransactionsByPeriod();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

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

        {/* Action Buttons and Filter */}
        <div className="flex flex-wrap gap-4 mb-6 justify-between items-center">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => openAddModal('expense')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-md"
            >
              + Add Expense
            </button>
            <button
              onClick={() => openAddModal('income')}
              className="px-6 py-3 bg-farm-green-600 hover:bg-farm-green-700 text-pearl rounded-lg font-semibold transition-colors shadow-md"
            >
              + Add Income
            </button>
            <button
              onClick={() => setShowCalculator(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
            >
              🧮 Calculator
            </button>
            <button
              onClick={() => setShowOverview(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-md"
            >
              📊 Overview
            </button>
          </div>

          <select
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-pearl dark:bg-bg-dark text-gray-800 dark:text-gray-100
                       focus:ring-2 focus:ring-farm-green-500"
          >
            <option value="all">All Farms</option>
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'expenses'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Expenses ({filteredExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
              activeTab === 'income'
                ? 'border-farm-green-600 text-farm-green-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Income ({filteredIncomes.length})
          </button>
        </div>

        {/* Transaction List */}
        <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl overflow-hidden">
          {activeTab === 'expenses' ? (
            filteredExpenses.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredExpenses.sort((a, b) => b.date.getTime() - a.date.getTime()).map((expense) => {
                  const farm = expense.farmId ? farms.find(f => f.id === expense.farmId) : null;
                  return (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-3xl">{getCategoryIcon(expense.category)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                                {expense.category}
                              </h3>
                              {farm && (
                                <span className="text-xs px-2 py-1 bg-farm-green-100 dark:bg-farm-green-900/30 text-farm-green-700 dark:text-farm-green-300 rounded">
                                  {farm.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {expense.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {expense.date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold text-red-600">
                            -₹{expense.amount.toLocaleString()}
                          </p>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                No expenses recorded yet. Click "+ Add Expense" to get started.
              </div>
            )
          ) : (
            filteredIncomes.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredIncomes.sort((a, b) => b.date.getTime() - a.date.getTime()).map((income) => {
                  const farm = income.farmId ? farms.find(f => f.id === income.farmId) : null;
                  return (
                    <motion.div
                      key={income.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-3xl">{getCategoryIcon(income.source)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
                                {income.source}
                              </h3>
                              {farm && (
                                <span className="text-xs px-2 py-1 bg-farm-green-100 dark:bg-farm-green-900/30 text-farm-green-700 dark:text-farm-green-300 rounded">
                                  {farm.name}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {income.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {income.date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold text-farm-green-600">
                            +₹{income.amount.toLocaleString()}
                          </p>
                          <button
                            onClick={() => deleteIncome(income.id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                No income recorded yet. Click "+ Add Income" to get started.
              </div>
            )
          )}
        </div>

        {/* Add Transaction Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Add {transactionType === 'expense' ? 'Expense' : 'Income'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100
                                 focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100
                                 focus:ring-2 focus:ring-farm-green-500"
                    >
                      {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <option key={cat} value={cat}>
                          {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Purchased rice seeds for north field"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100
                                 focus:ring-2 focus:ring-farm-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100
                                 focus:ring-2 focus:ring-farm-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Farm (Optional)
                    </label>
                    <select
                      value={farmId}
                      onChange={(e) => setFarmId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100
                                 focus:ring-2 focus:ring-farm-green-500"
                    >
                      <option value="">General (not farm-specific)</option>
                      {farms.map(farm => (
                        <option key={farm.id} value={farm.id}>{farm.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTransaction}
                    disabled={!amount || !description}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                      !amount || !description
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : transactionType === 'expense'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-farm-green-600 hover:bg-farm-green-700 text-white'
                    }`}
                  >
                    Add {transactionType === 'expense' ? 'Expense' : 'Income'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Calculator Modal */}
        <AnimatePresence>
          {showCalculator && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    🧮 Calculator
                  </h2>
                  <button
                    onClick={() => setShowCalculator(false)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Enter Expression (BODMAS)
                    </label>
                    <input
                      type="text"
                      value={calcExpression}
                      onChange={(e) => {
                        setCalcExpression(e.target.value);
                        if (e.target.value.trim()) {
                          calculateExpression(e.target.value);
                        } else {
                          setCalcResult(null);
                        }
                      }}
                      placeholder="e.g., (100 + 50) * 2 - 25"
                      className="w-full px-4 py-3 rounded-lg border-2 border-blue-300 dark:border-blue-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100 text-lg font-mono
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Supports: + - * / ( )
                    </p>
                  </div>

                  {calcResult !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-blue-500"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">Result:</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 font-mono">
                        {calcResult.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <button
                        onClick={() => {
                          setAmount(calcResult.toString());
                          setShowCalculator(false);
                          setShowAddModal(true);
                        }}
                        className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        Use in Transaction
                      </button>
                    </motion.div>
                  )}

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Examples:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono">
                      <li>• 100 + 200 = 300</li>
                      <li>• 50 * 3 = 150</li>
                      <li>• (100 + 50) * 2 = 300</li>
                      <li>• 1000 / 4 - 50 = 200</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Overview Modal */}
        <AnimatePresence>
          {showOverview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    📊 Financial Overview
                  </h2>
                  <button
                    onClick={() => setShowOverview(false)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Period Selector */}
                <div className="flex gap-4 mb-6 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOverviewPeriod('month')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        overviewPeriod === 'month'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setOverviewPeriod('year')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        overviewPeriod === 'year'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>

                  {overviewPeriod === 'month' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                                 bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100"
                    >
                      {monthNames.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </select>
                  )}

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-bg-dark text-gray-800 dark:text-gray-100"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Overview Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-2 border-red-500">
                    <p className="text-sm text-red-800 dark:text-red-300 mb-1">Total Expense</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{periodData.totalExpense.toLocaleString()}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {periodData.expenses.length} transactions
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-2 border-green-500">
                    <p className="text-sm text-green-800 dark:text-green-300 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{periodData.totalIncome.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {periodData.incomes.length} transactions
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${
                    periodData.netProfit >= 0
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-500'
                  }`}>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Net Profit</p>
                    <p className={`text-2xl font-bold ${
                      periodData.netProfit >= 0 ? 'text-purple-600' : 'text-gray-600'
                    }`}>
                      ₹{periodData.netProfit.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {overviewPeriod === 'month'
                        ? `${monthNames[selectedMonth]} ${selectedYear}`
                        : `Year ${selectedYear}`}
                    </p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expense Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                      Expense by Category
                    </h3>
                    <div className="space-y-2">
                      {expenseCategories.map(cat => {
                        const amount = periodData.expenses
                          .filter(e => e.category === cat)
                          .reduce((sum, e) => sum + e.amount, 0);
                        if (amount === 0) return null;
                        const percentage = periodData.totalExpense > 0
                          ? (amount / periodData.totalExpense * 100).toFixed(1)
                          : 0;
                        return (
                          <div key={cat} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getCategoryIcon(cat)}</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize">
                                {cat}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-600">₹{amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Income Breakdown */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                      Income by Source
                    </h3>
                    <div className="space-y-2">
                      {incomeCategories.map(cat => {
                        const amount = periodData.incomes
                          .filter(i => i.source === cat)
                          .reduce((sum, i) => sum + i.amount, 0);
                        if (amount === 0) return null;
                        const percentage = periodData.totalIncome > 0
                          ? (amount / periodData.totalIncome * 100).toFixed(1)
                          : 0;
                        return (
                          <div key={cat} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{getCategoryIcon(cat)}</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize">
                                {cat}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-600">₹{amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
