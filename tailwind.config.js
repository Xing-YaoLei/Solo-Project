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
        brand: {
          bg: "#0f1219",
          card: "#1e2435",
          border: "#2a3048",
          hover: "#252b3d",
          amber: "#f59e0b",
          green: "#10b981",
          red: "#ef4444",
          blue: "#3b82f6",
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
