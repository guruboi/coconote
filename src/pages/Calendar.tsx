import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '@/stores/taskStore';
import { useFarmStore } from '@/stores/farmStore';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@/types/calendar.types';

export const Calendar = () => {
  const { tasks, addTask, updateTask, deleteTask, completeTask, getTasksByMonth, getOverdueTasks } = useTaskStore();
  const { farms } = useFarmStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterFarm, setFilterFarm] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('general');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [farmId, setFarmId] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [cost, setCost] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get tasks for current month
  const monthTasks = useMemo(() => {
    return getTasksByMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth, tasks]);

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    return getOverdueTasks();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (filterFarm !== 'all') {
      filtered = filtered.filter(task => task.farmId === filterFarm);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, filterFarm, filterStatus]);

  // Calendar generation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const getTasksForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    return monthTasks.filter(task => {
      const taskDateStr = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDateStr === dateStr;
    });
  };

  const handleAddTask = () => {
    if (!title || !dueDate) return;

    const newTask: Task = {
      id: Date.now().toString(),
      farmId: farmId || undefined,
      title,
      description,
      category,
      priority,
      status: 'pending',
      dueDate: new Date(dueDate),
      estimatedDuration: estimatedDuration ? parseFloat(estimatedDuration) : undefined,
      cost: cost ? parseFloat(cost) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addTask(newTask);
    resetForm();
    setShowAddModal(false);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleToggleComplete = (task: Task) => {
    if (task.status === 'completed') {
      updateTask(task.id, { status: 'pending', completedDate: undefined });
    } else {
      completeTask(task.id);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setPriority('medium');
    setDueDate('');
    setFarmId('');
    setEstimatedDuration('');
    setCost('');
  };

  const categoryIcons: Record<TaskCategory, string> = {
    'planting': '🌱',
    'watering': '💧',
    'fertilizing': '🧪',
    'weeding': '🌿',
    'harvesting': '🌾',
    'pest-control': '🐛',
    'maintenance': '🔧',
    'livestock-care': '🐄',
    'market': '🏪',
    'general': '📋',
  };

  const priorityColors: Record<TaskPriority, string> = {
    'low': 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'high': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'urgent': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Calendar & Tasks
            </h1>
            {overdueTasks.length > 0 && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                ⚠️ {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-farm-green-600 hover:bg-farm-green-700 text-pearl rounded-lg font-semibold shadow-md transition-colors"
          >
            + Add Task
          </motion.button>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-farm-green-600 text-pearl'
                  : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300'
              }`}
            >
              📅 Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-farm-green-600 text-pearl'
                  : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300'
              }`}
            >
              📋 List
            </button>
          </div>

          {/* Farm Filter */}
          <select
            value={filterFarm}
            onChange={(e) => setFilterFarm(e.target.value)}
            className="px-4 py-2 bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            <option value="all">All Farms</option>
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="px-4 py-2 bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 shadow-lg mb-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousMonth}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Previous
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={goToToday}
                  className="text-sm text-farm-green-600 hover:text-farm-green-700 dark:text-farm-green-400 mt-1"
                >
                  Today
                </button>
              </div>
              <button
                onClick={goToNextMonth}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Next →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-24" />;
                }

                const dayTasks = getTasksForDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <motion.div
                    key={`day-${day}`}
                    whileHover={{ scale: 1.02 }}
                    className={`min-h-24 p-2 rounded-lg border transition-all ${
                      isCurrentDay
                        ? 'bg-farm-green-50 dark:bg-farm-green-900/20 border-farm-green-500'
                        : 'bg-frost dark:bg-bg-dark border-gray-300 dark:border-gray-600 hover:border-farm-green-400'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      isCurrentDay ? 'text-farm-green-700 dark:text-farm-green-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className={`text-xs px-2 py-1 rounded truncate ${priorityColors[task.priority]}`}
                          title={task.title}
                        >
                          {categoryIcons[task.category]} {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
                const farm = farms.find(f => f.id === task.farmId);

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-pearl dark:bg-bg-dark-alt rounded-xl p-4 shadow-md border-l-4 group relative ${
                      task.status === 'completed'
                        ? 'border-green-500 opacity-75'
                        : isOverdue
                        ? 'border-red-500'
                        : 'border-farm-green-500'
                    }`}
                  >
                    {/* Delete button - shows on hover */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="absolute top-4 right-4 w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                      title="Delete task"
                    >
                      🗑️
                    </button>

                    <div className="flex items-start gap-4 pr-10">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-farm-green-500'
                        }`}
                      >
                        {task.status === 'completed' && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Task details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h3 className={`text-lg font-semibold ${
                            task.status === 'completed'
                              ? 'line-through text-gray-500 dark:text-gray-500'
                              : 'text-gray-800 dark:text-gray-100'
                          }`}>
                            {categoryIcons[task.category]} {task.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          {isOverdue && task.status !== 'completed' && (
                            <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">
                              Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          {farm && <span>🌾 {farm.name}</span>}
                          {task.estimatedDuration && <span>⏱️ {task.estimatedDuration}h</span>}
                          {task.cost && <span>💰 ₹{task.cost}</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Add Task Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                  Add New Task
                </h2>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      placeholder="e.g., Water coconut trees"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      placeholder="Additional details..."
                    />
                  </div>

                  {/* Category & Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as TaskCategory)}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      >
                        <option value="planting">🌱 Planting</option>
                        <option value="watering">💧 Watering</option>
                        <option value="fertilizing">🧪 Fertilizing</option>
                        <option value="weeding">🌿 Weeding</option>
                        <option value="harvesting">🌾 Harvesting</option>
                        <option value="pest-control">🐛 Pest Control</option>
                        <option value="maintenance">🔧 Maintenance</option>
                        <option value="livestock-care">🐄 Livestock Care</option>
                        <option value="market">🏪 Market</option>
                        <option value="general">📋 General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Due Date & Farm */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Farm (Optional)
                      </label>
                      <select
                        value={farmId}
                        onChange={(e) => setFarmId(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                      >
                        <option value="">General Task</option>
                        {farms.map(farm => (
                          <option key={farm.id} value={farm.id}>{farm.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Duration & Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                        step="0.5"
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                        placeholder="e.g., 2.5"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Cost (₹)
                      </label>
                      <input
                        type="number"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-frost dark:bg-bg-dark text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
                        placeholder="e.g., 500"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={!title || !dueDate}
                    className="flex-1 px-4 py-3 bg-farm-green-600 text-pearl rounded-lg hover:bg-farm-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Task
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
