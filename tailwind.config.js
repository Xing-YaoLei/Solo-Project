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
        navy: {
          900: "#1E293B",
          950: "#0F172A",
        },
        accent: {
          cyan: "#06B6D4",
          orange: "#F97316",
        },
        neutral: {
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      gap: {
        card: "8px",
      },
    },
  },
  plugins: [],
};
