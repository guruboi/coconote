// News article categories
export type NewsCategory =
  | 'government-schemes'
  | 'crop-advisory'
  | 'weather-alert'
  | 'market-trends'
  | 'technology'
  | 'success-stories'
  | 'general';

// News article
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NewsCategory;
  source: string;
  imageUrl?: string;
  publishedDate: Date;
  tags: string[];
  important: boolean; // for highlighting important alerts
  region?: string; // Tamil Nadu, Coimbatore, etc.
}

// Weather condition types
export type WeatherCondition =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'thunderstorm'
  | 'partly-cloudy'
  | 'foggy';

// Weather forecast
export interface WeatherForecast {
  date: Date;
  condition: WeatherCondition;
  temperature: {
    min: number; // Celsius
    max: number; // Celsius
  };
  humidity: number; // percentage
  rainfall: number; // mm
  windSpeed: number; // km/h
  description: string;
}

// Weather advisory
export interface WeatherAdvisory {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  validUntil: Date;
  affectedRegions: string[];
}
