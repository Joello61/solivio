import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Palette foret - couleur primaire de marque Solivio
        foret: {
          50:  '#F0FAF5',
          100: '#D7F0E4',
          200: '#A8DBC4',
          300: '#6EC4A3',
          400: '#3EA87C',
          500: '#288663',
          600: '#1E6B52',
          700: '#16513F',
          800: '#0E3A2C',
          900: '#0A2820',
          950: '#05140F',
        },
        // Palette ambre - accent chaleureux
        ambre: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Tokens semantiques alignes sur le web
        primary: {
          DEFAULT: '#16513F',
          foreground: '#FFFFFF',
          50:  '#F0FAF5',
          100: '#D7F0E4',
          200: '#A8DBC4',
          300: '#6EC4A3',
          400: '#3EA87C',
          500: '#288663',
          600: '#1E6B52',
          700: '#16513F',
          800: '#0E3A2C',
          900: '#0A2820',
        },
        secondary: {
          DEFAULT: '#E8F5EF',
          foreground: '#16513F',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F4F9F6',
          foreground: '#5E7A6B',
        },
        accent: {
          DEFAULT: '#F59E0B',
          foreground: '#1C2B24',
        },
        border: '#D8EDDE',
        input:  '#D8EDDE',
        ring:   '#16513F',
        background: '#FFFFFF',
        foreground: '#1C2B24',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1C2B24',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
