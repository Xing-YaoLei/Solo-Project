/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7fa',
          100: '#d4ebf2',
          200: '#a9d7e5',
          300: '#7dbcd8',
          400: '#52a2cb',
          500: '#2d87b8',
          600: '#1a5f7a',
          700: '#144a61',
          800: '#0f3849',
          900: '#0a2631'
        },
        accent: {
          50: '#fff3ee',
          100: '#ffe1d2',
          200: '#ffbfa5',
          300: '#ff9d78',
          400: '#ff7f50',
          500: '#f46a3a',
          600: '#d9532a',
          700: '#b33f1e',
          800: '#8c2f16',
          900: '#662110'
        },
        mint: {
          50: '#eefaf6',
          100: '#d4f3e8',
          200: '#a8e7d1',
          300: '#98d8c8',
          400: '#6dc7ae',
          500: '#4db896',
          600: '#3a9a7c',
          700: '#2d7a61',
          800: '#215a49',
          900: '#163e31'
        },
        danger: {
          50: '#fdecec',
          100: '#fad5d5',
          200: '#f5a9a9',
          300: '#ed7d7d',
          400: '#e63946',
          500: '#d11f2e',
          600: '#ab1a25',
          700: '#84141d',
          800: '#5e0e14',
          900: '#38090c'
        },
        amber: {
          50: '#fef6ec',
          100: '#fce8cd',
          200: '#f9d09b',
          300: '#f4a261',
          400: '#ef8838',
          500: '#da6e1f',
          600: '#b35716',
          700: '#8a4211',
          800: '#622f0c',
          900: '#391c07'
        },
        ivory: '#faf8f5',
        'soft-blue': '#e8ecef'
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 8px rgba(26, 95, 122, 0.08)',
        'card-hover': '0 8px 24px rgba(26, 95, 122, 0.12)',
        soft: '0 1px 3px rgba(0, 0, 0, 0.06)'
      },
      borderRadius: {
        xl: '10px',
        '2xl': '16px'
      }
    }
  },
  plugins: []
};
