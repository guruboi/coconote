import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '@/stores/marketStore';
import type { CommodityCategory } from '@/types/market.types';

export const Market = () => {
  const { marketItems, watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, getItemsByCategory, searchItems } = useMarketStore();

  const [selectedCategory, setSelectedCategory] = useState<CommodityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');

  // Filter and sort items
  const displayedItems = useMemo(() => {
    let items = searchQuery
      ? searchItems(searchQuery)
      : getItemsByCategory(selectedCategory);

    // Sort
    items = [...items].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        return b.currentPrice - a.currentPrice;
      } else if (sortBy === 'change') {
        return (b.priceChange || 0) - (a.priceChange || 0);
      }
      return 0;
    });

    return items;
  }, [selectedCategory, searchQuery, sortBy, marketItems]);

  const categories: Array<{ value: CommodityCategory | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '🌐' },
    { value: 'grains', label: 'Grains', icon: '🌾' },
    { value: 'vegetables', label: 'Vegetables', icon: '🥬' },
    { value: 'fruits', label: 'Fruits', icon: '🍎' },
    { value: 'spices', label: 'Spices', icon: '🌶️' },
    { value: 'livestock', label: 'Livestock', icon: '🐄' },
    { value: 'dairy', label: 'Dairy', icon: '🥛' },
  ];

  const categoryIcons: Record<string, string> = {
    grains: '🌾',
    vegetables: '🥬',
    fruits: '🍎',
    spices: '🌶️',
    livestock: '🐄',
    dairy: '🥛',
    other: '📦',
  };

  const handleToggleWatchlist = (itemId: string) => {
    if (isInWatchlist(itemId)) {
      removeFromWatchlist(itemId);
    } else {
      addToWatchlist(itemId);
    }
  };

  const getPriceChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500 dark:text-gray-400';
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getPriceChangeIcon = (change?: number) => {
    if (!change) return '—';
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '—';
  };

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Market Prices
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Updated: {new Date().toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              ⭐ Watchlist: {watchlist.length}
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search commodities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 rounded-lg bg-pearl dark:bg-bg-dark-alt text-gray-800 dark:text-gray-100 placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-farm-green-500"
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

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-farm-green-600 text-pearl'
                    : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 hover:bg-farm-green-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sort by:</span>
            <div className="flex gap-2">
              {[
                { value: 'name', label: 'Name' },
                { value: 'price', label: 'Price' },
                { value: 'change', label: 'Change' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-farm-green-600 text-pearl'
                      : 'bg-pearl dark:bg-bg-dark-alt text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Market items grid */}
        {displayedItems.length === 0 ? (
          <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No items found matching your search' : 'No items available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-5 shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{categoryIcons[item.category]}</div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {item.category}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleWatchlist(item.id)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      isInWatchlist(item.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                    }`}
                    title={isInWatchlist(item.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                  >
                    ⭐
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                  {/* Current price */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-farm-green-600 dark:text-farm-green-400">
                      ₹{item.currentPrice}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      per {item.unit}
                    </span>
                  </div>

                  {/* Price change */}
                  {item.priceChange !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Previous: ₹{item.previousPrice}
                      </span>
                      <span className={`text-sm font-semibold flex items-center gap-1 ${getPriceChangeColor(item.priceChange)}`}>
                        <span className="text-lg">{getPriceChangeIcon(item.priceChange)}</span>
                        {Math.abs(item.priceChange).toFixed(2)}%
                      </span>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                    <span>📍</span>
                    <span>{item.location}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Watchlist section */}
        {watchlist.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Your Watchlist
            </h2>
            <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6">
              <div className="space-y-3">
                {watchlist.map((watchItem) => {
                  const item = marketItems.find((i) => i.id === watchItem.itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={watchItem.id}
                      className="flex items-center justify-between p-4 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryIcons[item.category]}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ₹{item.currentPrice} per {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {item.priceChange !== undefined && (
                          <span className={`text-sm font-semibold ${getPriceChangeColor(item.priceChange)}`}>
                            {getPriceChangeIcon(item.priceChange)} {Math.abs(item.priceChange).toFixed(2)}%
                          </span>
                        )}
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Remove from watchlist"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Market Information
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Prices shown are indicative rates from Coimbatore market. Actual prices may vary based on quality,
                quantity, and specific market conditions. Add items to your watchlist to track prices regularly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
