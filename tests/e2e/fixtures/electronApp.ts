import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
    const userDataDir = await mkdtemp(path.join(tmpdir(), 'snip-diff-e2e-'));

    // Launch Electron app with project root as cwd
    // headlessモードで実行（CI/ローカルともに）
    // ヘッドレスを無効にする場合は環境変数 HEADED=true を設定
    const isHeaded = process.env.HEADED === 'true';
    try {
      const electronApp = await electron.launch({
        args: isHeaded
          ? [`--user-data-dir=${userDataDir}`, '.']
          : [
              `--user-data-dir=${userDataDir}`,
              '--headless',
              '--disable-gpu',
              '--disable-dev-shm-usage',
              '--disable-software-rasterizer',
              '--no-sandbox',
              '.',
            ],
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          ELECTRON_ENABLE_LOGGING: '0',
        },
      });

      try {
        await electronApp.evaluate(async ({ app }) => app.whenReady());
        await use(electronApp);
      } finally {
        await electronApp.close();
      }
    } finally {
      await rm(userDataDir, { recursive: true, force: true });
    }
  },

  page: async ({ electronApp }, use) => {
    // Wait for window to be created
    const page = await electronApp.firstWindow({
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
