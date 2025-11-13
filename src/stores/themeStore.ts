import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeState {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

// Get system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Apply theme to document
const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      effectiveTheme: getSystemTheme(),

      setTheme: (theme: Theme) => {
        const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);
        set({ theme, effectiveTheme });
      },

      initializeTheme: () => {
        const { theme } = get();
        const effectiveTheme = theme === 'auto' ? getSystemTheme() : theme;
        applyTheme(effectiveTheme);
        set({ effectiveTheme });

        // Listen for system theme changes
        if (theme === 'auto') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handler = (e: MediaQueryListEvent) => {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            set({ effectiveTheme: newTheme });
          };
          mediaQuery.addEventListener('change', handler);
        }
      },
    }),
    {
      name: 'coconotecc-theme',
    }
  )
);
