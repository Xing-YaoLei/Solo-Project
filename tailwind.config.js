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
          50: '#E8F4F6',
          100: '#C5E4E9',
          200: '#9FD0D8',
          300: '#79BBC6',
          400: '#5CAFB8',
          500: '#0F4C5C',
          600: '#0D4352',
          700: '#0A3743',
          800: '#072B34',
          900: '#041F26',
        },
        amber: {
          50: '#FFF5EB',
          100: '#FFE8CC',
          400: '#E36414',
          500: '#CC5A12',
          600: '#B55010',
        },
        mint: {
          50: '#E8FBF9',
          100: '#C5F5F0',
          400: '#2EC4B6',
          500: '#27A99D',
          600: '#219085',
        },
        slate: {
          25: '#FCFCFD',
          50: '#F8FAFC',
          75: '#F1F5F9',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
          600: '#334155',
          700: '#1E293B',
          800: '#0F172A',
          900: '#020617',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
