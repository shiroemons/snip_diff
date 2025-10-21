import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'app/renderer/features/diff/utils/**', // Monaco Editor依存
    ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: ['app/**/*.{ts,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        'app/**/*.{test,spec}.{ts,tsx}',
        'app/**/*.d.ts',
        'app/main/main.ts', // Electron main process (hard to test)
        'app/preload/preload.ts', // Preload script (requires Electron environment)
        'app/renderer/main.tsx', // Entry point
        'app/renderer/features/diff/DiffEditor.tsx', // Monaco Editor integration (tested via mocks)
        'app/renderer/features/diff/utils/**', // Monaco Editor依存 (モックの問題でテスト除外)
        'app/renderer/features/diff/themes/**', // Monaco Editor依存
        'app/renderer/features/diff/hooks/useCompactMode.ts', // Monaco Editor依存
        'app/renderer/features/diff/components/**', // Monaco Editor依存
      ],
      thresholds: {
        lines: 0, // Start with no threshold, can be increased later
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/renderer'),
      '@shared': path.resolve(__dirname, './app/shared'),
      'monaco-editor': path.resolve(__dirname, './node_modules/monaco-editor'),
    },
  },
});
