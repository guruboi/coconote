// Market commodity categories
export type CommodityCategory =
  | 'grains'
  | 'vegetables'
  | 'fruits'
  | 'spices'
  | 'livestock'
  | 'dairy'
  | 'other';

// Market commodity/item
export interface MarketItem {
  id: string;
  name: string;
  category: CommodityCategory;
  currentPrice: number; // per kg or unit
  unit: 'kg' | 'quintal' | 'piece' | 'liter' | 'dozen';
  previousPrice?: number;
  priceChange?: number; // percentage change
  location: string; // market location
  lastUpdated: Date;
  inWatchlist?: boolean;
}

// Price history entry
export interface PriceHistoryEntry {
  date: Date;
  price: number;
}

// Market price trend
export interface MarketTrend {
  itemId: string;
  history: PriceHistoryEntry[];
  trend: 'up' | 'down' | 'stable';
}

// User's watchlist item
export interface WatchlistItem {
  id: string;
  itemId: string;
  alertPrice?: number; // alert when price reaches this
  addedAt: Date;
}
