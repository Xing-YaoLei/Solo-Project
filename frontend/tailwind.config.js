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
        'ocean-bg': '#0B1E3F',
        'ocean-dark': '#061229',
        'ocean-light': '#152B55',
        'cyan-primary': '#00D4FF',
        'cyan-glow': '#00F0FF',
        'orange-warning': '#FF8A00',
        'red-danger': '#FF3D57',
        'green-success': '#00E396',
        'purple-sponsor': '#8B5CF6',
        'panel-bg': 'rgba(11, 30, 63, 0.75)',
        'panel-border': 'rgba(0, 212, 255, 0.25)',
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.35), inset 0 0 20px rgba(0, 212, 255, 0.05)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.35), inset 0 0 20px rgba(139, 92, 246, 0.05)',
        'glow-orange': '0 0 16px rgba(255, 138, 0, 0.35)',
        'glow-red': '0 0 16px rgba(255, 61, 87, 0.45)',
        'glow-green': '0 0 16px rgba(0, 227, 150, 0.35)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'grid-overlay': "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
        'radial-cyan': 'radial-gradient(ellipse at top, rgba(0, 212, 255, 0.12), transparent 60%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'flow-line': 'flowLine 1.5s linear infinite',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 212, 255, 0.35)' },
          '50%': { boxShadow: '0 0 24px rgba(0, 212, 255, 0.75)' },
        },
        flowLine: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
