import type { ElectronApplication, Page } from '@playwright/test';
import { _electron as electron, test as base } from '@playwright/test';
import path from 'node:path';

/**
 * Electron app fixture for E2E testing
 */
export const test = base.extend<{
  electronApp: ElectronApplication;
  page: Page;
}>({
  electronApp: async ({}, use) => {
    // Get project root directory (where package.json is located)
    const projectRoot = path.join(__dirname, '../../..');

    // Launch Electron app with project root as cwd
    // headlessモードで実行（CI/ローカルともに）
    // ヘッドレスを無効にする場合は環境変数 HEADED=true を設定
    const isHeaded = process.env.HEADED === 'true';
    const electronApp = await electron.launch({
      args: isHeaded ? ['.'] : ['--headless', '--disable-gpu', '.'],
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    // Wait for the app to be ready
    await electronApp.evaluate(async ({ app }) => {
      return app.whenReady();
    });

    // Use the app
    await use(electronApp);

    // Clean up - close the app
    await electronApp.close();
  },

  page: async ({ electronApp }, use) => {
    // Wait for window to be created
    const page = await electronApp.waitForEvent('window', {
      timeout: 30000,
    });

    // Wait for the page to load completely
    await page.waitForLoadState('load', { timeout: 30000 });

    // Wait a bit more for React to render
    await page.waitForTimeout(2000);

    // Use the page
    await use(page);
  },
});

export { expect } from '@playwright/test';
