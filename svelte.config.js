import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: {
      '$lib': './src/lib',
      '$lib/*': './src/lib/*',
      '$server': './src/server',
      '$server/*': './src/server/*',
      '$shared': './src/shared',
      '$shared/*': './src/shared/*'
    }
  }
};

export default config;
