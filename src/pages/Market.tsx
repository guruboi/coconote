import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '@/stores/marketStore';
import type { CommodityCategory } from '@/types/market.types';

export const Market = () => {
  const { marketItems, watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, getItemsByCategory, searchItems } = useMarketStore();

  const [selectedCategory, setSelectedCategory] = useState<CommodityCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');
  const [showAIInsights, setShowAIInsights] = useState(true);

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

  // Generate AI-powered market insights
  const aiInsights = useMemo(() => {
    // Find top gainers and losers
    const itemsWithChange = marketItems.filter(item => item.priceChange !== undefined);
    const sortedByChange = [...itemsWithChange].sort((a, b) => (b.priceChange || 0) - (a.priceChange || 0));
    const topGainers = sortedByChange.slice(0, 3);
    const topLosers = sortedByChange.slice(-3).reverse();

    // Calculate average price change by category
    const categoryTrends: Record<string, { avgChange: number; count: number }> = {};
    itemsWithChange.forEach(item => {
      if (!categoryTrends[item.category]) {
        categoryTrends[item.category] = { avgChange: 0, count: 0 };
      }
      categoryTrends[item.category].avgChange += item.priceChange || 0;
      categoryTrends[item.category].count += 1;
    });

    Object.keys(categoryTrends).forEach(cat => {
      categoryTrends[cat].avgChange = categoryTrends[cat].avgChange / categoryTrends[cat].count;
    });

    // Find best category
    const bestCategory = Object.entries(categoryTrends).reduce((best, [cat, data]) => {
      return data.avgChange > (best?.data.avgChange || -Infinity) ? { cat, data } : best;
    }, null as { cat: string; data: { avgChange: number; count: number } } | null);

    // Generate insights
    const insights = [];

    if (topGainers.length > 0) {
      insights.push({
        type: 'positive' as const,
        title: 'Top Performing Commodities',
        description: `${topGainers[0].name} leads with ${topGainers[0].priceChange?.toFixed(1)}% increase. ${topGainers.length > 1 ? `${topGainers[1].name} (+${topGainers[1].priceChange?.toFixed(1)}%) and ${topGainers[2]?.name || 'others'} also showing strong growth.` : ''}`,
        action: 'Consider selling these items while prices are high.',
      });
    }

    if (bestCategory) {
      const trend = bestCategory.data.avgChange > 0 ? 'rising' : 'falling';
      insights.push({
        type: bestCategory.data.avgChange > 0 ? 'positive' as const : 'neutral' as const,
        title: `${bestCategory.cat.charAt(0).toUpperCase() + bestCategory.cat.slice(1)} Market ${trend === 'rising' ? 'Surge' : 'Adjustment'}`,
        description: `Average ${bestCategory.data.avgChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(bestCategory.data.avgChange).toFixed(1)}% across ${bestCategory.data.count} items.`,
        action: bestCategory.data.avgChange > 0 ? 'Good time to sell surplus stock.' : 'Consider holding stock for better prices.',
      });
    }

    if (topLosers.length > 0 && topLosers[0].priceChange && topLosers[0].priceChange < -5) {
      insights.push({
        type: 'warning' as const,
        title: 'Price Drops Alert',
        description: `${topLosers[0].name} down ${Math.abs(topLosers[0].priceChange).toFixed(1)}%. ${topLosers.length > 1 ? `${topLosers[1].name} and ${topLosers[2]?.name || 'others'} also declining.` : ''}`,
        action: 'Monitor these closely. Prices may stabilize soon.',
      });
    }

    // General market summary
    const avgChange = itemsWithChange.reduce((sum, item) => sum + (item.priceChange || 0), 0) / itemsWithChange.length;
    const marketSentiment = avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'stable';
    insights.push({
      type: marketSentiment === 'bullish' ? 'positive' as const : marketSentiment === 'bearish' ? 'warning' as const : 'neutral' as const,
      title: 'Overall Market Sentiment',
      description: `Market is ${marketSentiment} with average price change of ${avgChange.toFixed(2)}%.`,
      action: marketSentiment === 'bullish' ? 'Favorable conditions for sellers.' : marketSentiment === 'bearish' ? 'Consider holding inventory.' : 'Balanced market conditions.',
    });

    return insights;
  }, [marketItems]);

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

        {/* AI-Powered Market Insights */}
        {showAIInsights && aiInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🤖</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    AI Market Insights
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Smart analysis powered by market data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIInsights(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Hide insights"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight, index) => {
                const typeColors = {
                  positive: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
                  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
                  neutral: 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600',
                };

                const typeIcons = {
                  positive: '📈',
                  warning: '⚠️',
                  neutral: '📊',
                };

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${typeColors[insight.type]}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{typeIcons[insight.type]}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {insight.description}
                        </p>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 italic">
                          💡 {insight.action}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {!showAIInsights && (
          <button
            onClick={() => setShowAIInsights(true)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors font-medium"
          >
            <span>🤖</span>
            <span>Show AI Market Insights</span>
          </button>
        )}

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
