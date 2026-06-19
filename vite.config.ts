import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$server: path.resolve('./src/server'),
		}
	},
	ssr: {
		noExternal: ['@lucia-auth/adapter-drizzle', 'trpc-sveltekit']
	}
});
