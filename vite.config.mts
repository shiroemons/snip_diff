import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// package.jsonからバージョンを読み込む
const packageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
);
const appVersion = packageJson.version;

export default defineConfig({
  plugins: [react()],
  root: 'app/renderer',
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor'],
        },
      },
    },
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
  optimizeDeps: {
    include: ['monaco-editor'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
});
