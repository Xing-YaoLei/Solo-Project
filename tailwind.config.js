/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-navy': '#0A1628',
        'vivid-orange': '#FF6B35',
        'golden': '#F5C542',
        'glass': 'rgba(255,255,255,0.08)',
        'glass-border': 'rgba(255,255,255,0.15)',
      },
      fontFamily: {
        'display': ['"Noto Sans SC"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
}
