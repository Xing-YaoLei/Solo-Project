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
        charcoal: {
          DEFAULT: "#1A1A2E",
          dark: "#12121F",
          light: "#252542",
        },
        amber: {
          DEFAULT: "#D4A574",
          light: "#E0BA8E",
          dark: "#B8895A",
        },
        rust: {
          DEFAULT: "#C84B31",
          light: "#D96A52",
          dark: "#A63D26",
        },
        jade: {
          DEFAULT: "#2EC4B6",
          light: "#4DD4C8",
          dark: "#22A99D",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
