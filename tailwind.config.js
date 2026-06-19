import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F0FF',
          100: '#C7D9FF',
          200: '#94B8FF',
          300: '#5E8BFF',
          400: '#2F6AFF',
          500: '#165DFF',
          600: '#0E4AD1',
          700: '#0A389E',
          800: '#07276B',
          900: '#04173D'
        },
        accent: {
          orange: '#FF7D00',
          green: '#00B42A',
          red: '#F53F3F',
          yellow: '#FFAA00'
        },
        industrial: {
          bg: '#1D1D1F',
          card: '#2C2C2E',
          border: '#3A3A3C',
          text: '#F5F5F7',
          'text-secondary': '#A1A1AA',
          'text-muted': '#71717A'
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
