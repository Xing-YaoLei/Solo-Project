/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: '#eff6ff',
					100: '#dbeafe',
					200: '#bfdbfe',
					300: '#93c5fd',
					400: '#60a5fa',
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8',
					800: '#1e40af',
					900: '#1e3a8a',
				},
				status: {
					available: '#22c55e',
					booked: '#ef4444',
					occupied: '#f59e0b',
					cleaning: '#8b5cf6',
					maintenance: '#6b7280',
					blocked: '#374151'
				}
			}
		}
	},
	plugins: []
};
