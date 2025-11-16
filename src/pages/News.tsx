import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNewsStore } from '@/stores/newsStore';
import type { NewsCategory, WeatherCondition } from '@/types/news.types';

export const News = () => {
  const {
    articles,
    weatherForecast,
    advisories,
    bookmarkedArticles,
    bookmarkArticle,
    removeBookmark,
    isBookmarked,
    getArticlesByCategory,
    searchArticles,
  } = useNewsStore();

  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [showAIWeatherInsights, setShowAIWeatherInsights] = useState(true);

  // Filter articles
  const displayedArticles = useMemo(() => {
    let filtered = searchQuery ? searchArticles(searchQuery) : getArticlesByCategory(selectedCategory);
    return filtered.sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
  }, [selectedCategory, searchQuery, articles]);

  const categories: Array<{ value: NewsCategory | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '📰' },
    { value: 'government-schemes', label: 'Schemes', icon: '🏛️' },
    { value: 'crop-advisory', label: 'Advisory', icon: '🌾' },
    { value: 'weather-alert', label: 'Weather', icon: '🌦️' },
    { value: 'market-trends', label: 'Market', icon: '📈' },
    { value: 'technology', label: 'Tech', icon: '💻' },
    { value: 'success-stories', label: 'Stories', icon: '⭐' },
  ];

  const weatherIcons: Record<WeatherCondition, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    thunderstorm: '⛈️',
    'partly-cloudy': '⛅',
    foggy: '🌫️',
  };

  const handleToggleBookmark = (articleId: string) => {
    if (isBookmarked(articleId)) {
      removeBookmark(articleId);
    } else {
      bookmarkArticle(articleId);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'bg-orange-100 border-orange-500 text-orange-900 dark:bg-orange-900/20 dark:text-orange-300';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  // Generate AI-powered weather insights
  const aiWeatherInsights = useMemo(() => {
    if (weatherForecast.length === 0) return [];

    const insights = [];
    const totalRainfall = weatherForecast.reduce((sum, day) => sum + day.rainfall, 0);
    const rainyDays = weatherForecast.filter(day => day.rainfall > 0).length;
    const avgTemp = weatherForecast.reduce((sum, day) => sum + (day.temperature.max + day.temperature.min) / 2, 0) / weatherForecast.length;
    const avgHumidity = weatherForecast.reduce((sum, day) => sum + day.humidity, 0) / weatherForecast.length;
    const maxTemp = Math.max(...weatherForecast.map(day => day.temperature.max));
    const minTemp = Math.min(...weatherForecast.map(day => day.temperature.min));

    // Rainfall analysis
    if (totalRainfall > 50) {
      insights.push({
        type: 'warning' as const,
        icon: '🌧️',
        title: 'Heavy Rainfall Expected',
        description: `${totalRainfall.toFixed(0)}mm total rainfall forecasted over ${rainyDays} days. Waterlogging risk in low-lying areas.`,
        action: 'Ensure proper drainage. Delay irrigation. Protect vulnerable crops.',
      });
    } else if (totalRainfall === 0 && avgTemp > 30) {
      insights.push({
        type: 'warning' as const,
        icon: '☀️',
        title: 'Dry Spell Ahead',
        description: `No rainfall expected for the next 7 days with temperatures averaging ${avgTemp.toFixed(1)}°C.`,
        action: 'Plan irrigation schedule. Mulch to retain soil moisture. Monitor plant stress.',
      });
    } else if (totalRainfall > 0 && totalRainfall < 20) {
      insights.push({
        type: 'positive' as const,
        icon: '⛅',
        title: 'Moderate Rainfall',
        description: `Light to moderate rainfall (${totalRainfall.toFixed(0)}mm) expected. Good conditions for most crops.`,
        action: 'Ideal time for sowing. Reduce irrigation accordingly.',
      });
    }

    // Temperature insights
    if (maxTemp > 35) {
      insights.push({
        type: 'warning' as const,
        icon: '🌡️',
        title: 'Heat Stress Alert',
        description: `Temperatures reaching ${maxTemp}°C. High risk of crop stress and water stress.`,
        action: 'Increase irrigation frequency. Provide shade if possible. Monitor for heat damage.',
      });
    } else if (minTemp < 15) {
      insights.push({
        type: 'neutral' as const,
        icon: '❄️',
        title: 'Cool Temperatures',
        description: `Minimum temperatures dropping to ${minTemp}°C. Some crops may experience slow growth.`,
        action: 'Protect sensitive crops. Delay planting of warm-season crops.',
      });
    } else {
      insights.push({
        type: 'positive' as const,
        icon: '🌡️',
        title: 'Optimal Temperature Range',
        description: `Temperatures between ${minTemp}°C and ${maxTemp}°C. Ideal growing conditions for most crops.`,
        action: 'Excellent conditions for planting and cultivation.',
      });
    }

    // Humidity and disease risk
    if (avgHumidity > 80 && avgTemp > 25) {
      insights.push({
        type: 'warning' as const,
        icon: '🦠',
        title: 'High Disease Risk',
        description: `High humidity (${avgHumidity.toFixed(0)}%) combined with warm temperatures creates favorable conditions for fungal diseases.`,
        action: 'Monitor for leaf spots, blights, and mildew. Apply preventive fungicides if needed.',
      });
    } else if (avgHumidity < 40) {
      insights.push({
        type: 'neutral' as const,
        icon: '💨',
        title: 'Low Humidity',
        description: `Humidity averaging ${avgHumidity.toFixed(0)}%. Dry conditions may increase pest activity.`,
        action: 'Watch for spider mites and thrips. Ensure adequate watering.',
      });
    }

    // Best farming activities
    const goodDaysForSpray = weatherForecast.filter(
      day => day.rainfall === 0 && day.windSpeed < 15 && day.condition !== 'rainy'
    ).length;

    if (goodDaysForSpray >= 3) {
      insights.push({
        type: 'positive' as const,
        icon: '🚜',
        title: 'Ideal for Spray Operations',
        description: `${goodDaysForSpray} days with calm, dry conditions perfect for pesticide/fertilizer application.`,
        action: 'Schedule spray operations during these windows for maximum effectiveness.',
      });
    }

    // Climate change awareness
    const weatherPatternText = totalRainfall > 100
      ? 'heavy rainfall patterns'
      : totalRainfall === 0 && maxTemp > 35
      ? 'extreme heat and drought'
      : avgHumidity > 85
      ? 'high humidity levels'
      : 'variable weather patterns';

    insights.push({
      type: 'neutral' as const,
      icon: '🌍',
      title: 'Climate Adaptation Tips',
      description: `Current ${weatherPatternText} reflect changing climate patterns. Building resilience is key.`,
      action: 'Consider drought-resistant varieties, rainwater harvesting, and diversified cropping.',
    });

    return insights;
  }, [weatherForecast]);

  return (
    <div className="min-h-screen bg-frost dark:bg-bg-dark p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Weather & News
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Stay updated with weather forecasts and agricultural news
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              📑 Bookmarked: {bookmarkedArticles.length}
            </span>
          </div>
        </div>

        {/* Weather Advisories */}
        {advisories.length > 0 && (
          <div className="mb-6 space-y-3">
            {advisories.map((advisory) => (
              <motion.div
                key={advisory.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-4 border-l-4 ${getSeverityColor(advisory.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1">⚠️ {advisory.title}</h3>
                    <p className="text-sm mb-2">{advisory.description}</p>
                    <div className="flex gap-3 text-xs">
                      <span>📍 {advisory.affectedRegions.join(', ')}</span>
                      <span>
                        Valid until: {new Date(advisory.validUntil).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* AI Weather Insights */}
        {showAIWeatherInsights && aiWeatherInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🤖</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    AI Weather Intelligence
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Smart farming recommendations based on 7-day forecast
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAIWeatherInsights(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Hide insights"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiWeatherInsights.map((insight, index) => {
                const typeColors = {
                  positive: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
                  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
                  neutral: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600',
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
                      <span className="text-2xl">{insight.icon}</span>
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

        {!showAIWeatherInsights && (
          <button
            onClick={() => setShowAIWeatherInsights(true)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors font-medium"
          >
            <span>🤖</span>
            <span>Show AI Weather Intelligence</span>
          </button>
        )}

        {/* Weather Forecast */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            7-Day Weather Forecast
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {weatherForecast.map((forecast, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-4 text-center shadow-md"
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {index === 0
                    ? 'Today'
                    : new Date(forecast.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                      })}
                </p>
                <div className="text-4xl mb-2">{weatherIcons[forecast.condition]}</div>
                <div className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {forecast.temperature.max}° / {forecast.temperature.min}°
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>💧 {forecast.humidity}%</div>
                  {forecast.rainfall > 0 && <div>🌧️ {forecast.rainfall}mm</div>}
                  <div>💨 {forecast.windSpeed}km/h</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* News Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Agricultural News
          </h2>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search news articles..."
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
          </div>

          {/* News Articles */}
          {displayedArticles.length === 0 ? (
            <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No articles found matching your search' : 'No articles available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-pearl dark:bg-bg-dark-alt rounded-xl p-6 shadow-md border-l-4 ${
                    article.important
                      ? 'border-red-500'
                      : 'border-farm-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {article.important && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded">
                            IMPORTANT
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded capitalize">
                          {article.category.replace('-', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        {article.summary}
                      </p>
                      {expandedArticle === article.id && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-gray-700 dark:text-gray-300 text-sm mb-3 leading-relaxed"
                        >
                          {article.content}
                        </motion.p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>📰 {article.source}</span>
                        <span>
                          📅 {new Date(article.publishedDate).toLocaleDateString('en-IN')}
                        </span>
                        {article.region && <span>📍 {article.region}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBookmark(article.id)}
                      className={`ml-4 text-2xl transition-transform hover:scale-110 ${
                        isBookmarked(article.id) ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                      }`}
                      title={isBookmarked(article.id) ? 'Remove bookmark' : 'Bookmark article'}
                    >
                      📑
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedArticle(expandedArticle === article.id ? null : article.id)
                    }
                    className="text-sm text-farm-green-600 dark:text-farm-green-400 hover:text-farm-green-700 dark:hover:text-farm-green-300 font-medium"
                  >
                    {expandedArticle === article.id ? '▲ Show less' : '▼ Read more'}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarked Articles */}
        {bookmarkedArticles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Your Bookmarks
            </h2>
            <div className="bg-pearl dark:bg-bg-dark-alt rounded-xl p-6">
              <div className="space-y-3">
                {bookmarkedArticles.map((articleId) => {
                  const article = articles.find((a) => a.id === articleId);
                  if (!article) return null;

                  return (
                    <div
                      key={articleId}
                      className="flex items-center justify-between p-4 bg-frost dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {article.source} • {new Date(article.publishedDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeBookmark(articleId)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Remove bookmark"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
