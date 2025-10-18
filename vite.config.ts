import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'app/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/renderer'),
      '@shared': path.resolve(__dirname, './app/shared'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
