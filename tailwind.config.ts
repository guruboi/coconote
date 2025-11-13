import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        snow: 'rgb(var(--color-snow) / <alpha-value>)',
        frost: 'rgb(var(--color-frost) / <alpha-value>)',
        eggshell: 'rgb(var(--color-eggshell) / <alpha-value>)',
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        pearl: 'rgb(var(--color-pearl) / <alpha-value>)',
        'bg-light': 'rgb(var(--color-bg-light) / <alpha-value>)',
        'bg-light-alt': 'rgb(var(--color-bg-light-alt) / <alpha-value>)',
        'bg-dark': 'rgb(var(--color-bg-dark) / <alpha-value>)',
        'bg-dark-alt': 'rgb(var(--color-bg-dark-alt) / <alpha-value>)',
        'farm-green': {
          50: 'rgb(var(--color-farm-green-50) / <alpha-value>)',
          100: 'rgb(var(--color-farm-green-100) / <alpha-value>)',
          200: 'rgb(var(--color-farm-green-200) / <alpha-value>)',
          300: 'rgb(var(--color-farm-green-300) / <alpha-value>)',
          400: 'rgb(var(--color-farm-green-400) / <alpha-value>)',
          500: 'rgb(var(--color-farm-green-500) / <alpha-value>)',
          600: 'rgb(var(--color-farm-green-600) / <alpha-value>)',
          700: 'rgb(var(--color-farm-green-700) / <alpha-value>)',
          800: 'rgb(var(--color-farm-green-800) / <alpha-value>)',
          900: 'rgb(var(--color-farm-green-900) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
