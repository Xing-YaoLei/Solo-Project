import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		files: {
			routes: 'src/app-routes'
		},
		alias: {
			$lib: './src/lib',
			$trpc: './src/lib/trpc',
			$server: './src/lib/server',
			$types: './src/lib/types'
		}
	}
};

export default config;
