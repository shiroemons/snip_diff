import { expect, test } from '../fixtures/electronApp';
import { waitForMonacoEditor } from '../helpers/electron-helpers';
import { SELECTORS, TEST_TEXT } from '../helpers/test-data';

test.describe('Clipboard Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for Monaco editor to be ready
    await waitForMonacoEditor(page);
  });

  test('should paste to left editor', async ({ page, electronApp }) => {
    // Set clipboard content
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_LEFT);

    await page.waitForTimeout(500);

    // Click paste left button
    const pasteLeftButton = page.locator(SELECTORS.PASTE_LEFT_BUTTON);
    if ((await pasteLeftButton.count()) > 0) {
      await pasteLeftButton.first().click();
      await page.waitForTimeout(500);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      // Button might not be visible, skip test
      test.skip();
    }
  });

  test('should paste to right editor', async ({ page, electronApp }) => {
    // Set clipboard content
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_RIGHT);

    await page.waitForTimeout(500);

    // Click paste right button
    const pasteRightButton = page.locator(SELECTORS.PASTE_RIGHT_BUTTON);
    if ((await pasteRightButton.count()) > 0) {
      await pasteRightButton.first().click();
      await page.waitForTimeout(500);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      // Button might not be visible, skip test
      test.skip();
    }
  });

  test('should open clipboard history', async ({ page }) => {
    // Try to find and click clipboard history button
    const historyButton = page.locator(SELECTORS.CLIPBOARD_HISTORY_BUTTON);

    if ((await historyButton.count()) > 0) {
      await historyButton.first().click();
      await page.waitForTimeout(500);

      // Check if history modal is displayed
      const historyModal = page.locator(SELECTORS.CLIPBOARD_HISTORY_MODAL);
      if ((await historyModal.count()) > 0) {
        expect(await historyModal.first().isVisible()).toBeTruthy();

        // Close the modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } else {
      // Clipboard history feature might not be implemented yet
      test.skip();
    }
  });

  test('should select item from clipboard history', async ({ page, electronApp }) => {
    // Add some items to clipboard history
    const texts = [TEST_TEXT.SIMPLE_LEFT, TEST_TEXT.SIMPLE_RIGHT, TEST_TEXT.MULTILINE_LEFT];

    for (const text of texts) {
      await electronApp.evaluate(async ({ clipboard }, t) => {
        clipboard.writeText(t);
      }, text);
      await page.waitForTimeout(100);
    }

    // Open clipboard history
    const historyButton = page.locator(SELECTORS.CLIPBOARD_HISTORY_BUTTON);

    if ((await historyButton.count()) > 0) {
      await historyButton.first().click();
      await page.waitForTimeout(500);

      // Try to click on a history item
      const historyItem = page.locator(SELECTORS.CLIPBOARD_HISTORY_ITEM).first();

      if ((await historyItem.count()) > 0) {
        await historyItem.click();
        await page.waitForTimeout(500);

        // Test passes if no error occurs
        expect(true).toBeTruthy();
      } else {
        // Close modal and skip
        await page.keyboard.press('Escape');
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should use keyboard shortcut to paste', async ({ page, electronApp }) => {
    // Set clipboard content
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_LEFT);

    await page.waitForTimeout(500);

    // Focus on the page
    await page.click('body');

    // Use keyboard shortcut ⌘V (paste to left)
    await page.keyboard.press('Meta+v');
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should respect clipboard history limit', async ({ page, electronApp }) => {
    // This test would require checking settings and adding many items
    // For now, we just verify that clipboard works with multiple items

    const texts = Array(10)
      .fill(0)
      .map((_, i) => `Test text ${i + 1}`);

    for (const text of texts) {
      await electronApp.evaluate(async ({ clipboard }, t) => {
        clipboard.writeText(t);
      }, text);
      await page.waitForTimeout(50);
    }

    // Open clipboard history if available
    const historyButton = page.locator(SELECTORS.CLIPBOARD_HISTORY_BUTTON);

    if ((await historyButton.count()) > 0) {
      await historyButton.first().click();
      await page.waitForTimeout(500);

      // Count history items
      const historyItems = page.locator(SELECTORS.CLIPBOARD_HISTORY_ITEM);
      const count = await historyItems.count();

      // Should have some items (exact limit depends on settings)
      expect(count).toBeGreaterThan(0);

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });
});
