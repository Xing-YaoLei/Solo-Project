/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#eef3f9',
					100: '#d6e1ef',
					200: '#adc3de',
					300: '#789cc9',
					400: '#4a75ae',
					500: '#2f5890',
					600: '#1E3A5F',
					700: '#1a314f',
					800: '#162941',
					900: '#0f1c2e',
					950: '#0a1320'
				},
				accent: {
					50: '#fef3ed',
					100: '#fde3d3',
					200: '#fac3a5',
					300: '#f79b6c',
					400: '#f36c3a',
					500: '#E85D28',
					600: '#d9481a',
					700: '#b43816',
					800: '#902f18',
					900: '#752916',
					950: '#3f1109'
				},
				success: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14B8A6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
					950: '#042f2e'
				},
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',
					500: '#F59E0B',
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
					950: '#451a03'
				},
				danger: {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#ef4444',
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d',
					950: '#450a0a'
				},
				industrial: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a',
					950: '#020617'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
				numeric: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
			},
			boxShadow: {
				'industrial': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 1px -1px rgb(0 0 0 / 0.2)',
				'industrial-lg': '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.2)',
				'glow-primary': '0 0 20px rgba(30, 58, 95, 0.35)',
				'glow-accent': '0 0 20px rgba(232, 93, 40, 0.35)'
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(4px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.6' }
				}
			},
			animation: {
				'fade-in': 'fade-in 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite'
			}
		}
	},
	plugins: []
};
