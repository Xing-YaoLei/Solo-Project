/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0F1419',
          elevated: '#1A2029',
          card: 'rgba(26, 32, 41, 0.7)',
          border: 'rgba(255,255,255,0.08)',
        },
        brand: {
          50:  '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        risk: {
          low:      '#2ECC71',
          medium:   '#F39C12',
          high:     '#E67E22',
          critical: '#E63946',
        },
        chart: {
          blue:   '#1E88E5',
          purple: '#8B5CF6',
          green:  '#10B981',
          amber:  '#F59E0B',
          red:    '#EF4444',
          pink:   '#EC4899',
          cyan:   '#06B6D4',
        }
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
        'glow-top': 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, transparent 60%)',
      },
      boxShadow: {
        'card': '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -10px rgba(0,0,0,0.5)',
        'glow-blue': '0 0 0 1px rgba(59,130,246,0.25), 0 8px 24px -4px rgba(59,130,246,0.35)',
        'glow-red': '0 0 0 1px rgba(230,57,70,0.25), 0 8px 24px -4px rgba(230,57,70,0.35)',
      },
      keyframes: {
        'pulse-soft': {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.6 },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)',   opacity: 1 },
        },
        'ping-ring': {
          '0%':   { transform: 'scale(1)',   opacity: 0.6 },
          '100%': { transform: 'scale(2.2)', opacity: 0 },
        }
      },
      animation: {
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'ping-ring': 'ping-ring 1.8s cubic-bezier(0,0,0.2,1) infinite',
      }
    },
  },
  plugins: [],
};
