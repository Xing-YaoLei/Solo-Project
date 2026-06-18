import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          'matter-js': ['matter-js'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['phaser', 'matter-js'],
  },
});
