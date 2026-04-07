import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/demo/**'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VideoPlayer',
      formats: ['es', 'umd'],
      fileName: (format) => `video-player.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  server: {
    open: '/demo/index.html',
  },
});
