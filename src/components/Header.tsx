import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
// import { useThemeStore } from '@/stores/themeStore';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, getUnreadCount } = useUserStore();
  // const { theme, setTheme } = useThemeStore(); // Will be used for theme toggle later
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = getUnreadCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { label: 'Profile', action: () => navigate('/profile') },
    { label: 'Switch Users', action: () => navigate('/switch-user') },
    { label: 'Analytics', action: () => navigate('/analytics') },
    { label: 'Export/Import Data', action: () => navigate('/data-management') },
    { label: 'Connectors', action: () => navigate('/connectors') },
    { label: 'Contacts', action: () => navigate('/contacts') },
    { label: 'Logout', action: handleLogout, danger: true },
  ];

  const navItems = [
    { label: 'Farms', path: '/', icon: '🌾' },
    { label: 'Finance', path: '/finance', icon: '💰' },
    { label: 'Market', path: '/market', icon: '📊' },
    { label: 'News', path: '/news', icon: '📰' },
    { label: 'Calendar', path: '/calendar', icon: '📅' },
  ];

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/farm');
    }
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-pearl dark:bg-bg-dark-alt shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* App Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-farm-green-600 rounded-lg flex items-center justify-center">
              <span className="text-pearl font-bold text-xl">C</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 hidden sm:block">
              CocoNoteCC
            </h1>
          </motion.div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search farms, notes, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg bg-frost dark:bg-bg-dark
                           text-gray-800 dark:text-gray-100 placeholder-gray-500
                           border border-gray-300 dark:border-gray-600
                           focus:outline-none focus:ring-2 focus:ring-farm-green-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/farm/create')}
              className="w-10 h-10 bg-farm-green-600 hover:bg-farm-green-700 rounded-lg
                         flex items-center justify-center text-pearl transition-colors"
              title="Add Farm"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </motion.button>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 bg-frost dark:bg-bg-dark rounded-lg
                           flex items-center justify-center relative hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-pearl text-xs
                                   rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-pearl dark:bg-bg-dark-alt rounded-lg
                               shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <p className="p-4 text-gray-500 dark:text-gray-400 text-center">
                        No notifications
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-frost dark:bg-bg-dark
                           hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 bg-farm-green-600 rounded-full flex items-center justify-center">
                  <span className="text-pearl font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'G'}
                  </span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-medium hidden md:block">
                  {user?.name || 'Guest'}
                </span>
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </motion.button>

              {/* User Menu Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-pearl dark:bg-bg-dark-alt rounded-lg
                               shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    {userMenuItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          item.action();
                          setShowUserMenu(false);
                        }}
                        className={`w-full px-4 py-3 text-left transition-colors
                                    ${item.danger
                                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isActiveRoute(item.path)
                    ? 'bg-farm-green-600 text-pearl'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
