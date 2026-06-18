/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				navy: {
					50: '#f0f4fa',
					100: '#d9e2f0',
					200: '#b3c5e0',
					300: '#8ba8d0',
					400: '#648bc0',
					500: '#3d6eb0',
					600: '#2f588e',
					700: '#23426b',
					800: '#172c48',
					900: '#0b1625',
					950: '#060b13'
				},
				cyan: {
					400: '#22d3ee',
					500: '#06b6d4'
				}
			},
			fontFamily: {
				sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif']
			},
			animation: {
				'fade-in': 'fadeIn 0.5s ease-out',
				'slide-up': 'slideUp 0.4s ease-out'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(12px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			}
		}
	},
	plugins: []
};
