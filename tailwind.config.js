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
          900: '#0F1B2D',
          800: '#1B2A4A',
          700: '#253A5E',
          600: '#2F4A72',
          500: '#3D5A86',
        },
        amber: {
          500: '#E8A838',
          400: '#F0BC5E',
          300: '#F5D08A',
        },
        status: {
          success: '#2ECC71',
          danger: '#E74C3C',
          info: '#3498DB',
          muted: '#7F8C8D',
        }
      },
      fontFamily: {
        heading: ['DM Sans', 'Noto Sans SC', 'sans-serif'],
        body: ['Noto Sans SC', 'DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
