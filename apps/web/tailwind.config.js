/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a5f',
          light: '#2c5282',
          dark: '#152a45',
        },
        accent: '#d4a853',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        serif: ['var(--font-serif-sc)', '"Noto Serif SC"', 'serif'],
        sans: ['var(--font-sans-sc)', '"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
