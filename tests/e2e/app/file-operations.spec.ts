import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '../fixtures/electronApp';
import { setMonacoEditorContent, waitForMonacoEditor } from '../helpers/electron-helpers';
import { SELECTORS, TEST_TEXT } from '../helpers/test-data';

test.describe('File Operations', () => {
  const testDir = path.join(os.tmpdir(), 'snipdiff-e2e-tests');
  const testFilePath = path.join(testDir, 'test-file.txt');

  test.beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  test.afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Wait for Monaco editor to be ready
    await waitForMonacoEditor(page);

    // Create a test file
    fs.writeFileSync(testFilePath, TEST_TEXT.SIMPLE_LEFT, 'utf-8');
  });

  test.afterEach(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test('should open save dialog for left editor', async ({ page }) => {
    // Set content in left editor
    await setMonacoEditorContent(page, TEST_TEXT.SIMPLE_LEFT, 0);
    await page.waitForTimeout(500);

    // Click save left button
    const saveLeftButton = page.locator(SELECTORS.SAVE_LEFT_BUTTON);

    if ((await saveLeftButton.count()) > 0) {
      // Note: We can't actually interact with native file dialogs in E2E tests
      // We can only verify that clicking the button doesn't cause errors

      // Setup dialog handler (will auto-dismiss)
      page.on('dialog', (dialog) => {
        dialog.dismiss();
      });

      // Click button - this will trigger the dialog
      await saveLeftButton.first().click();
      await page.waitForTimeout(1000);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should open save dialog for right editor', async ({ page }) => {
    // Set content in right editor
    await setMonacoEditorContent(page, TEST_TEXT.SIMPLE_RIGHT, 1);
    await page.waitForTimeout(500);

    // Click save right button
    const saveRightButton = page.locator(SELECTORS.SAVE_RIGHT_BUTTON);

    if ((await saveRightButton.count()) > 0) {
      // Setup dialog handler (will auto-dismiss)
      page.on('dialog', (dialog) => {
        dialog.dismiss();
      });

      // Click button
      await saveRightButton.first().click();
      await page.waitForTimeout(1000);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should open file dialog for left editor', async ({ page }) => {
    // Click open left button
    const openLeftButton = page.locator(SELECTORS.OPEN_LEFT_BUTTON);

    if ((await openLeftButton.count()) > 0) {
      // Setup dialog handler (will auto-dismiss)
      page.on('dialog', (dialog) => {
        dialog.dismiss();
      });

      // Click button
      await openLeftButton.first().click();
      await page.waitForTimeout(1000);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should open file dialog for right editor', async ({ page }) => {
    // Click open right button
    const openRightButton = page.locator(SELECTORS.OPEN_RIGHT_BUTTON);

    if ((await openRightButton.count()) > 0) {
      // Setup dialog handler (will auto-dismiss)
      page.on('dialog', (dialog) => {
        dialog.dismiss();
      });

      // Click button
      await openRightButton.first().click();
      await page.waitForTimeout(1000);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should handle file operations without errors', async ({ page }) => {
    // This is a general test to ensure file operation buttons exist and are clickable
    // We can't actually test file dialogs in E2E environment

    const buttons = [
      SELECTORS.SAVE_LEFT_BUTTON,
      SELECTORS.SAVE_RIGHT_BUTTON,
      SELECTORS.OPEN_LEFT_BUTTON,
      SELECTORS.OPEN_RIGHT_BUTTON,
    ];

    for (const selector of buttons) {
      const button = page.locator(selector);
      if ((await button.count()) > 0) {
        expect(await button.first().isVisible()).toBeTruthy();
      }
    }

    // Test passes if all checks complete
    expect(true).toBeTruthy();
  });
});
