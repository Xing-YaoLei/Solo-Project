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
        'deep-blue': '#0A1628',
        'cyan-accent': '#00E5FF',
        'warn-orange': '#FF6B35',
        'success-green': '#00E676',
        'surface': '#111D33',
        'surface-light': '#1A2A44',
      },
      fontFamily: {
        'display': ['Orbitron', 'monospace'],
        'body': ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
