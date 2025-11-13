// User profile
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar?: string;
  createdAt: Date;
  settings: UserSettings;
}

// User settings
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ta'; // English or Tamil
  notifications: NotificationSettings;
  units: UnitPreferences;
}

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  email: boolean;
  push: boolean;
  weatherAlerts: boolean;
  marketUpdates: boolean;
  taskReminders: boolean;
}

// Unit preferences
export interface UnitPreferences {
  area: 'acres' | 'hectares' | 'sqft';
  distance: 'feet' | 'meters';
  weight: 'kg' | 'pounds';
  currency: 'INR' | 'USD';
}

// Contact for farm-related contacts
export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: 'supplier' | 'buyer' | 'worker' | 'advisor' | 'other';
  notes?: string;
  addedAt: Date;
}

// Connector integrations
export interface Connector {
  id: string;
  type: 'google-calendar' | 'amazon' | 'flipkart' | 'other';
  connected: boolean;
  connectedAt?: Date;
  accessToken?: string;
  refreshToken?: string;
}

// Finance types
export interface Expense {
  id: string;
  farmId?: string;
  date: Date;
  category: 'seeds' | 'fertilizer' | 'pesticide' | 'labor' | 'equipment' | 'water' | 'electricity' | 'other';
  amount: number;
  description: string;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank';
  invoiceUrl?: string;
}

export interface Income {
  id: string;
  farmId?: string;
  date: Date;
  source: 'harvest' | 'livestock' | 'other';
  amount: number;
  description: string;
  buyer?: string;
}

export interface Budget {
  id: string;
  farmId?: string;
  month: number;
  year: number;
  plannedExpense: number;
  actualExpense: number;
  plannedIncome: number;
  actualIncome: number;
}

// Market data
export interface MarketPrice {
  id: string;
  commodity: string;
  price: number;
  unit: string;
  market: string;
  date: Date;
  trend: 'up' | 'down' | 'stable';
}

// Weather data
export interface WeatherForecast {
  date: Date;
  location: string;
  temperature: {
    min: number;
    max: number;
  };
  humidity: number;
  rainfall: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  windSpeed: number;
}

// Calendar event
export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'reminder' | 'harvest' | 'meeting' | 'other';
  farmId?: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}
