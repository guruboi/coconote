import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketItem, WatchlistItem } from '@/types/market.types';

interface MarketState {
  marketItems: MarketItem[];
  watchlist: WatchlistItem[];

  // Watchlist operations
  addToWatchlist: (itemId: string, alertPrice?: number) => void;
  removeFromWatchlist: (itemId: string) => void;
  isInWatchlist: (itemId: string) => boolean;

  // Getters
  getItemsByCategory: (category: string) => MarketItem[];
  searchItems: (query: string) => MarketItem[];
}

// Sample market data for Tamil Nadu/Coimbatore region
const sampleMarketItems: MarketItem[] = [
  // Grains
  {
    id: '1',
    name: 'Rice',
    category: 'grains',
    currentPrice: 45,
    previousPrice: 42,
    priceChange: 7.14,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '2',
    name: 'Wheat',
    category: 'grains',
    currentPrice: 35,
    previousPrice: 36,
    priceChange: -2.78,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '3',
    name: 'Maize',
    category: 'grains',
    currentPrice: 28,
    previousPrice: 28,
    priceChange: 0,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },

  // Vegetables
  {
    id: '4',
    name: 'Tomato',
    category: 'vegetables',
    currentPrice: 25,
    previousPrice: 30,
    priceChange: -16.67,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '5',
    name: 'Onion',
    category: 'vegetables',
    currentPrice: 35,
    previousPrice: 32,
    priceChange: 9.38,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '6',
    name: 'Potato',
    category: 'vegetables',
    currentPrice: 30,
    previousPrice: 28,
    priceChange: 7.14,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '7',
    name: 'Carrot',
    category: 'vegetables',
    currentPrice: 40,
    previousPrice: 38,
    priceChange: 5.26,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '8',
    name: 'Cabbage',
    category: 'vegetables',
    currentPrice: 20,
    previousPrice: 22,
    priceChange: -9.09,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },

  // Fruits
  {
    id: '9',
    name: 'Banana',
    category: 'fruits',
    currentPrice: 6,
    previousPrice: 5,
    priceChange: 20,
    unit: 'piece',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '10',
    name: 'Mango',
    category: 'fruits',
    currentPrice: 80,
    previousPrice: 75,
    priceChange: 6.67,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '11',
    name: 'Coconut',
    category: 'fruits',
    currentPrice: 30,
    previousPrice: 28,
    priceChange: 7.14,
    unit: 'piece',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '12',
    name: 'Apple',
    category: 'fruits',
    currentPrice: 150,
    previousPrice: 145,
    priceChange: 3.45,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },

  // Spices
  {
    id: '13',
    name: 'Turmeric',
    category: 'spices',
    currentPrice: 180,
    previousPrice: 175,
    priceChange: 2.86,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '14',
    name: 'Chilli (Red)',
    category: 'spices',
    currentPrice: 220,
    previousPrice: 230,
    priceChange: -4.35,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '15',
    name: 'Coriander',
    category: 'spices',
    currentPrice: 120,
    previousPrice: 115,
    priceChange: 4.35,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '16',
    name: 'Cumin',
    category: 'spices',
    currentPrice: 450,
    previousPrice: 440,
    priceChange: 2.27,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },

  // Livestock
  {
    id: '17',
    name: 'Chicken',
    category: 'livestock',
    currentPrice: 180,
    previousPrice: 175,
    priceChange: 2.86,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '18',
    name: 'Goat',
    category: 'livestock',
    currentPrice: 650,
    previousPrice: 630,
    priceChange: 3.17,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '19',
    name: 'Eggs',
    category: 'livestock',
    currentPrice: 60,
    previousPrice: 58,
    priceChange: 3.45,
    unit: 'dozen',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },

  // Dairy
  {
    id: '20',
    name: 'Milk',
    category: 'dairy',
    currentPrice: 45,
    previousPrice: 44,
    priceChange: 2.27,
    unit: 'liter',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
  {
    id: '21',
    name: 'Curd',
    category: 'dairy',
    currentPrice: 50,
    previousPrice: 48,
    priceChange: 4.17,
    unit: 'kg',
    location: 'Coimbatore Market',
    lastUpdated: new Date(),
  },
];

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      marketItems: sampleMarketItems,
      watchlist: [],

      addToWatchlist: (itemId, alertPrice) => {
        const exists = get().watchlist.find((w) => w.itemId === itemId);
        if (!exists) {
          set((state) => ({
            watchlist: [
              ...state.watchlist,
              {
                id: Date.now().toString(),
                itemId,
                alertPrice,
                addedAt: new Date(),
              },
            ],
          }));
        }
      },

      removeFromWatchlist: (itemId) => {
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.itemId !== itemId),
        }));
      },

      isInWatchlist: (itemId) => {
        return get().watchlist.some((w) => w.itemId === itemId);
      },

      getItemsByCategory: (category) => {
        if (category === 'all') return get().marketItems;
        return get().marketItems.filter((item) => item.category === category);
      },

      searchItems: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().marketItems.filter((item) =>
          item.name.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'market-storage',
    }
  )
);
