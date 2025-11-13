import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NewsArticle, WeatherForecast, WeatherAdvisory } from '@/types/news.types';

interface NewsState {
  articles: NewsArticle[];
  weatherForecast: WeatherForecast[];
  advisories: WeatherAdvisory[];
  bookmarkedArticles: string[]; // article IDs

  // Operations
  bookmarkArticle: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;

  // Getters
  getArticlesByCategory: (category: string) => NewsArticle[];
  getImportantArticles: () => NewsArticle[];
  searchArticles: (query: string) => NewsArticle[];
}

// Sample news articles for Tamil Nadu farmers
const sampleArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Tamil Nadu Government Announces New Subsidy for Drip Irrigation',
    summary: 'State government provides 60% subsidy on drip irrigation systems to promote water conservation.',
    content: 'The Tamil Nadu government has announced a new scheme providing 60% subsidy on drip irrigation systems for farmers. This initiative aims to promote water conservation and efficient irrigation practices across the state.',
    category: 'government-schemes',
    source: 'TN Agriculture Department',
    publishedDate: new Date('2025-11-10'),
    tags: ['subsidy', 'irrigation', 'water-conservation'],
    important: true,
    region: 'Tamil Nadu',
  },
  {
    id: '2',
    title: 'Weather Advisory: Moderate Rainfall Expected in Western Districts',
    summary: 'IMD forecasts moderate to heavy rainfall in Coimbatore, Nilgiris, and Erode districts this week.',
    content: 'The India Meteorological Department (IMD) has issued an advisory for moderate to heavy rainfall in western Tamil Nadu districts including Coimbatore, Nilgiris, and Erode from November 13-15. Farmers are advised to postpone harvesting activities and ensure proper drainage in fields.',
    category: 'weather-alert',
    source: 'IMD Chennai',
    publishedDate: new Date('2025-11-12'),
    tags: ['weather', 'rainfall', 'advisory'],
    important: true,
    region: 'Coimbatore',
  },
  {
    id: '3',
    title: 'Record Coconut Prices in Pollachi Market',
    summary: 'Coconut prices reach ₹35 per piece due to high demand and low supply.',
    content: 'Coconut prices in Pollachi market have reached an all-time high of ₹35 per piece due to increased demand and reduced supply. Farmers are advised to consider harvesting mature coconuts to benefit from the current market rates.',
    category: 'market-trends',
    source: 'Pollachi Market Committee',
    publishedDate: new Date('2025-11-11'),
    tags: ['coconut', 'prices', 'market'],
    important: false,
    region: 'Pollachi',
  },
  {
    id: '4',
    title: 'New Mobile App for Soil Testing Results',
    summary: 'TN Agricultural University launches mobile app for instant soil test results and recommendations.',
    content: 'Tamil Nadu Agricultural University has launched a new mobile application that allows farmers to access their soil testing results and receive customized fertilizer recommendations instantly. The app is available in Tamil and English.',
    category: 'technology',
    source: 'TNAU Coimbatore',
    publishedDate: new Date('2025-11-09'),
    tags: ['technology', 'soil-testing', 'mobile-app'],
    important: false,
    region: 'Tamil Nadu',
  },
  {
    id: '5',
    title: 'Organic Farming Success: Coimbatore Farmer Earns ₹15 Lakhs Annually',
    summary: 'Local farmer shares journey of transitioning to organic farming and achieving success.',
    content: 'Ravi Kumar from Mettupalayam has successfully transitioned to organic farming and now earns ₹15 lakhs annually from his 5-acre farm. He grows organic vegetables and supplies to premium retailers in Coimbatore. His success story is inspiring many farmers in the region.',
    category: 'success-stories',
    source: 'Farmers Weekly',
    publishedDate: new Date('2025-11-08'),
    tags: ['organic-farming', 'success-story', 'vegetables'],
    important: false,
    region: 'Coimbatore',
  },
  {
    id: '6',
    title: 'Pest Alert: Fall Armyworm Detected in Maize Crops',
    summary: 'Agricultural officers advise immediate pest control measures for maize farmers.',
    content: 'Fall armyworm has been detected in maize crops across several villages in Coimbatore district. The Agricultural Department advises farmers to inspect their crops regularly and apply recommended pesticides. Contact your nearest Krishi Vigyan Kendra for guidance.',
    category: 'crop-advisory',
    source: 'District Agriculture Office',
    publishedDate: new Date('2025-11-07'),
    tags: ['pest-control', 'maize', 'alert'],
    important: true,
    region: 'Coimbatore',
  },
  {
    id: '7',
    title: 'PM-KISAN Scheme: Next Installment Date Announced',
    summary: '14th installment of PM-KISAN to be credited by November 30th.',
    content: 'The Ministry of Agriculture has announced that the 14th installment under PM-KISAN scheme will be credited to farmers\' bank accounts by November 30th. Eligible farmers will receive ₹2,000 directly in their accounts. Ensure your Aadhaar is linked to your bank account.',
    category: 'government-schemes',
    source: 'Ministry of Agriculture',
    publishedDate: new Date('2025-11-06'),
    tags: ['pm-kisan', 'subsidy', 'government-scheme'],
    important: true,
    region: 'India',
  },
  {
    id: '8',
    title: 'Best Practices for Coconut Cultivation During Winter',
    summary: 'Expert tips on irrigation, fertilization, and pest management for coconut farms.',
    content: 'Experts from TNAU recommend specific practices for coconut cultivation during winter months. Key recommendations include reducing irrigation frequency, applying organic manure, and monitoring for rhinoceros beetle infestations. Winter is ideal for replanting and intercropping.',
    category: 'crop-advisory',
    source: 'TNAU Extension Services',
    publishedDate: new Date('2025-11-05'),
    tags: ['coconut', 'cultivation', 'best-practices'],
    important: false,
    region: 'Tamil Nadu',
  },
  {
    id: '9',
    title: 'Drone Technology for Crop Monitoring Gains Popularity',
    summary: 'Farmers adopting drone technology for efficient crop health monitoring and spraying.',
    content: 'Drone technology is gaining popularity among progressive farmers in Tamil Nadu for crop health monitoring and pesticide spraying. Several custom hiring centers now offer drone services at affordable rates. This technology helps in early detection of crop stress and precise application of inputs.',
    category: 'technology',
    source: 'AgTech India',
    publishedDate: new Date('2025-11-04'),
    tags: ['drone', 'technology', 'precision-farming'],
    important: false,
    region: 'Tamil Nadu',
  },
  {
    id: '10',
    title: 'Turmeric Prices Expected to Rise in Coming Months',
    summary: 'Market analysts predict 20% increase in turmeric prices due to low production.',
    content: 'Market analysts predict a 20% increase in turmeric prices in the coming months due to lower production in Erode and Salem districts. Farmers with stored turmeric are advised to hold their produce for better returns. Current rate in Erode market is ₹180/kg.',
    category: 'market-trends',
    source: 'Erode Turmeric Market',
    publishedDate: new Date('2025-11-03'),
    tags: ['turmeric', 'prices', 'market-analysis'],
    important: false,
    region: 'Erode',
  },
];

// Sample weather forecast for next 7 days
const sampleWeatherForecast: WeatherForecast[] = [
  {
    date: new Date(),
    condition: 'partly-cloudy',
    temperature: { min: 21, max: 30 },
    humidity: 65,
    rainfall: 0,
    windSpeed: 12,
    description: 'Partly cloudy with mild winds',
  },
  {
    date: new Date(Date.now() + 86400000 * 1),
    condition: 'cloudy',
    temperature: { min: 22, max: 28 },
    humidity: 70,
    rainfall: 0,
    windSpeed: 15,
    description: 'Cloudy skies expected',
  },
  {
    date: new Date(Date.now() + 86400000 * 2),
    condition: 'rainy',
    temperature: { min: 20, max: 26 },
    humidity: 85,
    rainfall: 15,
    windSpeed: 18,
    description: 'Light to moderate rainfall',
  },
  {
    date: new Date(Date.now() + 86400000 * 3),
    condition: 'rainy',
    temperature: { min: 21, max: 27 },
    humidity: 80,
    rainfall: 25,
    windSpeed: 20,
    description: 'Moderate rainfall expected',
  },
  {
    date: new Date(Date.now() + 86400000 * 4),
    condition: 'thunderstorm',
    temperature: { min: 20, max: 25 },
    humidity: 90,
    rainfall: 35,
    windSpeed: 25,
    description: 'Thunderstorm with heavy rain',
  },
  {
    date: new Date(Date.now() + 86400000 * 5),
    condition: 'cloudy',
    temperature: { min: 21, max: 28 },
    humidity: 75,
    rainfall: 5,
    windSpeed: 15,
    description: 'Cloudy with light drizzle',
  },
  {
    date: new Date(Date.now() + 86400000 * 6),
    condition: 'partly-cloudy',
    temperature: { min: 22, max: 30 },
    humidity: 65,
    rainfall: 0,
    windSpeed: 12,
    description: 'Partly cloudy and pleasant',
  },
];

// Sample weather advisories
const sampleAdvisories: WeatherAdvisory[] = [
  {
    id: '1',
    title: 'Heavy Rainfall Alert',
    description: 'Heavy rainfall expected in Coimbatore district on Nov 15-16. Farmers should ensure proper drainage and postpone harvesting activities.',
    severity: 'high',
    validUntil: new Date(Date.now() + 86400000 * 4),
    affectedRegions: ['Coimbatore', 'Pollachi', 'Mettupalayam'],
  },
  {
    id: '2',
    title: 'High Wind Speed Warning',
    description: 'Wind speeds up to 25 km/h expected. Secure loose structures and protect young plants.',
    severity: 'medium',
    validUntil: new Date(Date.now() + 86400000 * 3),
    affectedRegions: ['Coimbatore', 'Erode', 'Tiruppur'],
  },
];

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      articles: sampleArticles,
      weatherForecast: sampleWeatherForecast,
      advisories: sampleAdvisories,
      bookmarkedArticles: [],

      bookmarkArticle: (articleId) => {
        const exists = get().bookmarkedArticles.includes(articleId);
        if (!exists) {
          set((state) => ({
            bookmarkedArticles: [...state.bookmarkedArticles, articleId],
          }));
        }
      },

      removeBookmark: (articleId) => {
        set((state) => ({
          bookmarkedArticles: state.bookmarkedArticles.filter((id) => id !== articleId),
        }));
      },

      isBookmarked: (articleId) => {
        return get().bookmarkedArticles.includes(articleId);
      },

      getArticlesByCategory: (category) => {
        if (category === 'all') return get().articles;
        return get().articles.filter((article) => article.category === category);
      },

      getImportantArticles: () => {
        return get().articles.filter((article) => article.important);
      },

      searchArticles: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().articles.filter(
          (article) =>
            article.title.toLowerCase().includes(lowerQuery) ||
            article.summary.toLowerCase().includes(lowerQuery) ||
            article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
        );
      },
    }),
    {
      name: 'news-storage',
    }
  )
);
