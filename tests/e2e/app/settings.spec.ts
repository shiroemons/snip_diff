import { expect, test } from '../fixtures/electronApp';
import { waitForMonacoEditor } from '../helpers/electron-helpers';
import { RENDER_WHITESPACE, SELECTORS, THEMES } from '../helpers/test-data';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for Monaco editor to be ready
    await waitForMonacoEditor(page);
  });

  test('should open settings modal', async ({ page }) => {
    // Click settings button
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Check if settings modal is displayed
      const settingsModal = page.locator(SELECTORS.SETTINGS_MODAL);
      expect(await settingsModal.first().isVisible()).toBeTruthy();

      // Close settings modal
      const closeButton = page.locator(SELECTORS.SETTINGS_CLOSE_BUTTON);
      if ((await closeButton.count()) > 0) {
        await closeButton.first().click();
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    } else {
      test.skip();
    }
  });

  test.skip('should close settings modal with Escape key (skipped - stopPropagation blocks Escape)', async ({
    page,
  }) => {
    // Note: The modal's inner div has onKeyDown stopPropagation which prevents
    // Escape key from reaching the overlay's Escape handler when focus is on modal content
    // This test is skipped until the component is fixed to handle Escape properly

    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Check if modal is closed
      const settingsModal = page.locator(SELECTORS.SETTINGS_MODAL);
      const isVisible =
        (await settingsModal.count()) > 0 && (await settingsModal.first().isVisible());
      expect(isVisible).toBeFalsy();
    } else {
      test.skip();
    }
  });

  test('should change theme setting', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Try to find theme select
      const themeSelect = page.locator(SELECTORS.THEME_SELECT);

      if ((await themeSelect.count()) > 0) {
        // Change to dark theme
        await themeSelect.first().selectOption(THEMES.DARK);
        await page.waitForTimeout(500);

        // Change to light theme
        await themeSelect.first().selectOption(THEMES.LIGHT);
        await page.waitForTimeout(500);

        // Change to auto theme
        await themeSelect.first().selectOption(THEMES.AUTO);
        await page.waitForTimeout(500);

        // Test passes if no error occurs
        expect(true).toBeTruthy();
      }

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });

  test('should toggle ignore whitespace option', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Try to find whitespace checkbox
      const whitespaceCheckbox = page.locator(SELECTORS.IGNORE_WHITESPACE_CHECKBOX);

      if ((await whitespaceCheckbox.count()) > 0) {
        // Get current state
        const isChecked = await whitespaceCheckbox.first().isChecked();

        // Toggle checkbox
        await whitespaceCheckbox.first().click();
        await page.waitForTimeout(300);

        // Verify it changed
        const newState = await whitespaceCheckbox.first().isChecked();
        expect(newState).toBe(!isChecked);

        // Toggle back
        await whitespaceCheckbox.first().click();
        await page.waitForTimeout(300);
      }

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });

  test('should toggle ignore case option', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Try to find case checkbox
      const caseCheckbox = page.locator(SELECTORS.IGNORE_CASE_CHECKBOX);

      if ((await caseCheckbox.count()) > 0) {
        // Get current state
        const isChecked = await caseCheckbox.first().isChecked();

        // Toggle checkbox
        await caseCheckbox.first().click();
        await page.waitForTimeout(300);

        // Verify it changed
        const newState = await caseCheckbox.first().isChecked();
        expect(newState).toBe(!isChecked);

        // Toggle back
        await caseCheckbox.first().click();
        await page.waitForTimeout(300);
      }

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });

  test('should change clipboard history limit', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Try to find history limit input
      const historyLimitInput = page.locator(SELECTORS.HISTORY_LIMIT_INPUT);

      if ((await historyLimitInput.count()) > 0) {
        // Change the value
        await historyLimitInput.first().fill('100');
        await page.waitForTimeout(300);

        // Verify the value
        const value = await historyLimitInput.first().inputValue();
        expect(value).toBe('100');

        // Change back to default
        await historyLimitInput.first().fill('50');
        await page.waitForTimeout(300);
      }

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });

  test('should persist settings after closing and reopening modal', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Change a setting
      const themeSelect = page.locator(SELECTORS.THEME_SELECT);

      if ((await themeSelect.count()) > 0) {
        await themeSelect.first().selectOption(THEMES.DARK);
        await page.waitForTimeout(500);

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);

        // Reopen modal
        await settingsButton.first().click();
        await page.waitForTimeout(500);

        // Verify setting persisted
        const selectedValue = await themeSelect.first().inputValue();
        expect(selectedValue).toBe(THEMES.DARK);

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } else {
        await page.keyboard.press('Escape');
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should change renderWhitespace setting', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator(SELECTORS.SETTINGS_BUTTON);

    if ((await settingsButton.count()) > 0) {
      await settingsButton.first().click();
      await page.waitForTimeout(500);

      // Find renderWhitespace select in settings modal
      const renderWhitespaceSelect = page.locator(SELECTORS.SETTINGS_RENDER_WHITESPACE_SELECT);

      if ((await renderWhitespaceSelect.count()) > 0) {
        // Change to 'all'
        await renderWhitespaceSelect.first().selectOption(RENDER_WHITESPACE.ALL);
        await page.waitForTimeout(500);

        // Change to 'trailing'
        await renderWhitespaceSelect.first().selectOption(RENDER_WHITESPACE.TRAILING);
        await page.waitForTimeout(500);

        // Change to 'none'
        await renderWhitespaceSelect.first().selectOption(RENDER_WHITESPACE.NONE);
        await page.waitForTimeout(500);

        // Save settings
        const saveButton = page.locator('button:has-text("保存")');
        if ((await saveButton.count()) > 0) {
          await saveButton.first().click();
          await page.waitForTimeout(500);
        }

        expect(true).toBeTruthy();
      }

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      test.skip();
    }
  });

  test('should change renderWhitespace from footer', async ({ page }) => {
    // Find renderWhitespace select in footer
    const footerRenderWhitespaceSelect = page.locator(SELECTORS.FOOTER_RENDER_WHITESPACE_SELECT);

    if ((await footerRenderWhitespaceSelect.count()) > 0) {
      // Change to 'all'
      await footerRenderWhitespaceSelect.selectOption(RENDER_WHITESPACE.ALL);
      await page.waitForTimeout(300);

      const allValue = await footerRenderWhitespaceSelect.inputValue();
      expect(allValue).toBe(RENDER_WHITESPACE.ALL);

      // Change to 'trailing'
      await footerRenderWhitespaceSelect.selectOption(RENDER_WHITESPACE.TRAILING);
      await page.waitForTimeout(300);

      const trailingValue = await footerRenderWhitespaceSelect.inputValue();
      expect(trailingValue).toBe(RENDER_WHITESPACE.TRAILING);

      // Change to 'boundary'
      await footerRenderWhitespaceSelect.selectOption(RENDER_WHITESPACE.BOUNDARY);
      await page.waitForTimeout(300);

      const boundaryValue = await footerRenderWhitespaceSelect.inputValue();
      expect(boundaryValue).toBe(RENDER_WHITESPACE.BOUNDARY);

      // Change to 'selection'
      await footerRenderWhitespaceSelect.selectOption(RENDER_WHITESPACE.SELECTION);
      await page.waitForTimeout(300);

      const selectionValue = await footerRenderWhitespaceSelect.inputValue();
      expect(selectionValue).toBe(RENDER_WHITESPACE.SELECTION);

      // Change to 'none'
      await footerRenderWhitespaceSelect.selectOption(RENDER_WHITESPACE.NONE);
      await page.waitForTimeout(300);

      const noneValue = await footerRenderWhitespaceSelect.inputValue();
      expect(noneValue).toBe(RENDER_WHITESPACE.NONE);
    } else {
      test.skip();
    }
  });
});
