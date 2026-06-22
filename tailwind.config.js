/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1B2A4A',
          800: '#243556',
          700: '#2E4068',
          600: '#3A4F7A',
          500: '#4A6291',
        },
        amber: {
          600: '#D97706',
          500: '#E5940A',
          400: '#F5AD2E',
        },
        emerald: {
          600: '#059669',
          500: '#10B981',
        },
        rose: {
          600: '#E11D48',
          500: '#F43F5E',
        },
        slate: {
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
