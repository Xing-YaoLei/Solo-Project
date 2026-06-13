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
        primary: {
          50: '#FDF5F5',
          100: '#FBE8EA',
          200: '#F4C9CE',
          300: '#E8B4B8',
          400: '#D49AA0',
          500: '#B76E79',
          600: '#9E5A65',
          700: '#7A454E',
          800: '#5A3239',
          900: '#3D2026',
        },
        accent: {
          50: '#FCF8F0',
          100: '#F7EDD8',
          200: '#EFDCB0',
          300: '#E4C684',
          400: '#D9B35E',
          500: '#C9A961',
          600: '#B08E45',
          700: '#8A6D34',
          800: '#634D25',
          900: '#3D2F17',
        },
        dark: {
          50: '#F5F3F6',
          100: '#E8E4EA',
          200: '#CFC7D3',
          300: '#AFA2B5',
          400: '#7E6D87',
          500: '#5A4764',
          600: '#42324B',
          700: '#2D1B33',
          800: '#1E1023',
          900: '#120816',
        },
        cream: {
          50: '#FDFCFB',
          100: '#FDF8F5',
          200: '#FAF0E9',
          300: '#F5E6DB',
          400: '#EBD5C4',
          500: '#DCC0A6',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(183, 110, 121, 0.08)',
        'card-hover': '0 8px 30px rgba(183, 110, 121, 0.15)',
        'rose': '0 4px 20px rgba(183, 110, 121, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'number': 'numberRoll 1.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        numberRoll: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
