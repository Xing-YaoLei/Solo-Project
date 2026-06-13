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
        'rose-gold': '#B76E79',
        'dark-brown': '#3E2723',
        'ivory': '#FFFFF0',
        'emerald-accent': '#50C878',
        'amber-accent': '#FFBF00',
        'salon-dark': '#1a0f0a',
        'salon-card': '#2a1a14',
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'body': ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
