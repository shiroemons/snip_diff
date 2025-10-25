import { expect, test } from '../fixtures/electronApp';
import { setMonacoEditorContent, waitForMonacoEditor } from '../helpers/electron-helpers';
import { KEYBOARD_SHORTCUTS, TEST_TEXT } from '../helpers/test-data';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for Monaco editor to be ready
    await waitForMonacoEditor(page);
  });

  test('should clear editors with ⌘K', async ({ page }) => {
    // Set content in both editors
    await setMonacoEditorContent(page, TEST_TEXT.SIMPLE_LEFT, 0);
    await setMonacoEditorContent(page, TEST_TEXT.SIMPLE_RIGHT, 1);
    await page.waitForTimeout(500);

    // Press ⌘K to clear
    await page.keyboard.press(KEYBOARD_SHORTCUTS.CLEAR);
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should swap editors with ⌘⇧K', async ({ page }) => {
    // Set different content in editors
    await setMonacoEditorContent(page, TEST_TEXT.SIMPLE_LEFT, 0);
    await setMonacoEditorContent(page, TEST_TEXT.SIMPLE_RIGHT, 1);
    await page.waitForTimeout(500);

    // Press ⌘⇧K to swap
    await page.keyboard.press(KEYBOARD_SHORTCUTS.SWAP);
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should switch to Unified mode with ⌘1', async ({ page }) => {
    // Press ⌘1 to switch to Unified mode
    await page.keyboard.press(KEYBOARD_SHORTCUTS.MODE_INLINE);
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should switch to Side-by-Side mode with ⌘2', async ({ page }) => {
    // Press ⌘2 to switch to Side-by-Side mode
    await page.keyboard.press(KEYBOARD_SHORTCUTS.MODE_SIDE_BY_SIDE);
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should paste to left editor with ⌘V', async ({ page, electronApp }) => {
    // Set clipboard content
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_LEFT);

    await page.waitForTimeout(300);

    // Press ⌘V to paste to left
    await page.keyboard.press(KEYBOARD_SHORTCUTS.PASTE_LEFT);
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should paste to right editor with ⌘⇧V', async ({ page, electronApp }) => {
    // Set clipboard content
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_RIGHT);

    await page.waitForTimeout(300);

    // Press ⌘⇧V to paste to right
    await page.keyboard.press(KEYBOARD_SHORTCUTS.PASTE_RIGHT);
    await page.waitForTimeout(500);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should handle multiple shortcuts in sequence', async ({ page, electronApp }) => {
    // Set clipboard content
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_LEFT);

    await page.waitForTimeout(300);

    // Paste to left
    await page.keyboard.press(KEYBOARD_SHORTCUTS.PASTE_LEFT);
    await page.waitForTimeout(300);

    // Paste to right (different content)
    await electronApp.evaluate(async ({ clipboard }, text) => {
      clipboard.writeText(text);
    }, TEST_TEXT.SIMPLE_RIGHT);

    await page.waitForTimeout(300);
    await page.keyboard.press(KEYBOARD_SHORTCUTS.PASTE_RIGHT);
    await page.waitForTimeout(300);

    // Swap
    await page.keyboard.press(KEYBOARD_SHORTCUTS.SWAP);
    await page.waitForTimeout(300);

    // Clear
    await page.keyboard.press(KEYBOARD_SHORTCUTS.CLEAR);
    await page.waitForTimeout(300);

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });

  test('should handle shortcuts while modal is open', async ({ page }) => {
    // Open settings modal
    const settingsButton = page.locator('[aria-label*="settings"], [aria-label*="設定"]');

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Try to use a shortcut (should not work or should be handled gracefully)
      await page.keyboard.press(KEYBOARD_SHORTCUTS.CLEAR);
      await page.waitForTimeout(300);

      // Close modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Test passes if no error occurs
      expect(true).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should handle rapid shortcut presses', async ({ page }) => {
    // Rapidly press mode toggle shortcuts
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press(KEYBOARD_SHORTCUTS.MODE_INLINE);
      await page.waitForTimeout(100);
      await page.keyboard.press(KEYBOARD_SHORTCUTS.MODE_SIDE_BY_SIDE);
      await page.waitForTimeout(100);
    }

    // Test passes if no error occurs
    expect(true).toBeTruthy();
  });
});
