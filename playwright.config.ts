import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for Electron app E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Maximum time one test can run for
  timeout: 60000,

  // Test execution settings
  fullyParallel: false, // Run tests serially for Electron (single window at a time)
  forbidOnly: !!process.env.CI, // Fail the build on CI if you accidentally left test.only
  retries: process.env.CI ? 2 : 0, // Retry on CI only
  workers: 1, // Single worker for Electron tests

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['list'],
  ],

  use: {
    // Base URL for the app (not used for Electron, but kept for consistency)
    // Electron tests will use the electronApp fixture

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Folder for test artifacts
  outputDir: 'test-results/',
});
