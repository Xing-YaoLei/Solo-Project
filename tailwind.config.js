/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#eef3f9',
          100: '#d5e1ef',
          200: '#b3c9e0',
          300: '#85a9cb',
          400: '#5182b2',
          500: '#2e6396',
          600: '#1e3a5f',
          700: '#1a3150',
          800: '#172a43',
          900: '#132338',
        },
        accent: {
          50: '#fff3ed',
          100: '#ffe2d5',
          200: '#ffc0a5',
          300: '#ff986b',
          400: '#ff6b35',
          500: '#f94f15',
          600: '#ea370b',
          700: '#c2270b',
          800: '#9a2110',
          900: '#7d1e11',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        display: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
