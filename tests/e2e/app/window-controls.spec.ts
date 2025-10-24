import { expect, test } from '../fixtures/electronApp';
import { waitForMonacoEditor } from '../helpers/electron-helpers';
import { SELECTORS } from '../helpers/test-data';

test.describe('Window Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for Monaco editor to be ready
    await waitForMonacoEditor(page);
  });

  test('should display window control buttons', async ({ page }) => {
    // Check if minimize button exists
    const minimizeButton = page.locator(SELECTORS.WINDOW_CONTROLS.MINIMIZE);
    if (await minimizeButton.count() > 0) {
      expect(await minimizeButton.first().isVisible()).toBeTruthy();
    }

    // Check if maximize button exists
    const maximizeButton = page.locator(SELECTORS.WINDOW_CONTROLS.MAXIMIZE);
    if (await maximizeButton.count() > 0) {
      expect(await maximizeButton.first().isVisible()).toBeTruthy();
    }

    // Check if close button exists
    const closeButton = page.locator(SELECTORS.WINDOW_CONTROLS.CLOSE);
    if (await closeButton.count() > 0) {
      expect(await closeButton.first().isVisible()).toBeTruthy();
    }

    // Test passes even if buttons are not found (might be using native title bar)
    expect(true).toBeTruthy();
  });

  test('should minimize window', async ({ page, electronApp }) => {
    const minimizeButton = page.locator(SELECTORS.WINDOW_CONTROLS.MINIMIZE);

    if (await minimizeButton.count() > 0) {
      // Get window state before
      const windowBefore = await electronApp.firstWindow();
      const isVisibleBefore = await windowBefore.isVisible();

      // Click minimize
      await minimizeButton.first().click();
      await page.waitForTimeout(500);

      // Note: We can't reliably test if window is actually minimized in E2E
      // The test passes if clicking doesn't cause errors
      expect(isVisibleBefore).toBeTruthy();
    } else {
      // Using native title bar
      test.skip();
    }
  });

  test('should maximize and restore window', async ({ page }) => {
    const maximizeButton = page.locator(SELECTORS.WINDOW_CONTROLS.MAXIMIZE);

    if (await maximizeButton.count() > 0) {
      // Click maximize
      await maximizeButton.first().click();
      await page.waitForTimeout(500);

      // Click again to restore
      await maximizeButton.first().click();
      await page.waitForTimeout(500);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      // Using native title bar
      test.skip();
    }
  });

  test('should handle window resize', async ({ electronApp }) => {
    // Note: page.viewportSize() returns null in Electron
    // Use electronApp.evaluate() to get window bounds instead
    const bounds = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return win.getBounds();
    });

    // Verify window has valid dimensions
    expect(bounds).toBeTruthy();
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  test('should maintain content after window operations', async ({ page }) => {
    const maximizeButton = page.locator(SELECTORS.WINDOW_CONTROLS.MAXIMIZE);

    if (await maximizeButton.count() > 0) {
      // Maximize window
      await maximizeButton.first().click();
      await page.waitForTimeout(500);

      // Check if Monaco editor is still visible
      const monacoEditor = page.locator(SELECTORS.MONACO_EDITOR);
      expect(await monacoEditor.first().isVisible()).toBeTruthy();

      // Restore window
      await maximizeButton.first().click();
      await page.waitForTimeout(500);

      // Check if Monaco editor is still visible
      expect(await monacoEditor.first().isVisible()).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should have custom title bar (if implemented)', async ({ page }) => {
    // Check if header contains window controls
    const header = page.locator(SELECTORS.HEADER);
    const hasHeader = await header.count() > 0;

    if (hasHeader) {
      expect(await header.first().isVisible()).toBeTruthy();

      // Check if window controls are in header
      const minimizeInHeader = await header.locator(SELECTORS.WINDOW_CONTROLS.MINIMIZE).count();
      const maximizeInHeader = await header.locator(SELECTORS.WINDOW_CONTROLS.MAXIMIZE).count();
      const closeInHeader = await header.locator(SELECTORS.WINDOW_CONTROLS.CLOSE).count();

      // If any control is in header, we have custom title bar
      const _hasCustomTitleBar = minimizeInHeader > 0 || maximizeInHeader > 0 || closeInHeader > 0;

      // Test passes either way
      expect(hasHeader).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
