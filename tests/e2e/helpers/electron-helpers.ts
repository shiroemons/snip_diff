import type { ElectronApplication, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Helper functions for Electron E2E tests
 */

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Get window title
 */
export async function getWindowTitle(electronApp: ElectronApplication): Promise<string> {
  const page = await electronApp.firstWindow();
  return page.title();
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.$(selector)) !== null;
}

/**
 * Wait for text content
 */
export async function waitForText(page: Page, selector: string, text: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await expect(page.locator(selector)).toContainText(text, { timeout });
}

/**
 * Type text with delay (simulates real user typing)
 */
export async function typeText(page: Page, selector: string, text: string, delay = 10) {
  await page.fill(selector, '');
  await page.type(selector, text, { delay });
}

/**
 * Press keyboard shortcut
 */
export async function pressShortcut(page: Page, shortcut: string) {
  await page.keyboard.press(shortcut);
}

/**
 * Get element text content
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return (await element.textContent()) || '';
}

/**
 * Wait for Monaco Editor to be ready
 */
export async function waitForMonacoEditor(page: Page, timeout = 10000) {
  // Wait for Monaco Editor to be initialized
  await page.waitForSelector('.monaco-editor', { state: 'visible', timeout });
}

/**
 * Get Monaco Editor content
 */
export async function getMonacoEditorContent(page: Page, editorIndex = 0): Promise<string> {
  // Monaco Editor stores content in its model
  // We need to use evaluate to get the content
  return page.evaluate((index) => {
    const editors = document.querySelectorAll('.monaco-editor');
    const editor = editors[index];
    if (!editor) {
      throw new Error(`Monaco editor not found at index ${index}`);
    }
    // Monaco editor content is stored in textarea
    const textarea = editor.querySelector('textarea');
    return textarea?.value || '';
  }, editorIndex);
}

/**
 * Set Monaco Editor content
 */
export async function setMonacoEditorContent(
  page: Page,
  content: string,
  editorIndex = 0
): Promise<void> {
  await page.evaluate(
    ({ index, text }) => {
      const editors = document.querySelectorAll('.monaco-editor');
      const editor = editors[index];
      if (!editor) {
        throw new Error(`Monaco editor not found at index ${index}`);
      }
      const textarea = editor.querySelector('textarea');
      if (textarea) {
        // Focus the editor
        textarea.focus();
        // Set the value
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(textarea, text);
        // Trigger input event
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
      }
    },
    { index: editorIndex, text: content }
  );
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png` });
}

/**
 * Wait for specific time
 */
export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
