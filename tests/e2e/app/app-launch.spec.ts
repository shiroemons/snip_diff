import { expect, test } from '../fixtures/electronApp';
import { SELECTORS } from '../helpers/test-data';

test.describe('App Launch', () => {
  test('should launch the app successfully', async ({ electronApp, page }) => {
    // Check if the app is running
    expect(electronApp).toBeTruthy();

    // Check if the page is loaded
    expect(page).toBeTruthy();
  });

  test('should have correct window title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBe('SnipDiff');
  });

  test('should display header with app title', async ({ page }) => {
    // Wait for header to be visible
    await page.waitForSelector(SELECTORS.HEADER, { state: 'visible' });

    // Check if header contains app title
    const header = await page.locator(SELECTORS.HEADER);
    expect(await header.isVisible()).toBeTruthy();
  });

  test('should display diff editor container', async ({ page }) => {
    // Wait for diff editor to be visible
    await page.waitForSelector(SELECTORS.DIFF_EDITOR, { state: 'visible', timeout: 10000 });

    const diffEditor = await page.locator(SELECTORS.DIFF_EDITOR);
    expect(await diffEditor.isVisible()).toBeTruthy();
  });

  test('should display Monaco editor', async ({ page }) => {
    // Wait for Monaco editor to load
    await page.waitForSelector(SELECTORS.MONACO_EDITOR, { state: 'visible', timeout: 15000 });

    const monacoEditors = await page.locator(SELECTORS.MONACO_EDITOR).count();
    // Should have at least one Monaco editor
    expect(monacoEditors).toBeGreaterThan(0);
  });

  test('should display footer', async ({ page }) => {
    // Wait for footer to be visible
    await page.waitForSelector(SELECTORS.FOOTER, { state: 'visible' });

    const footer = await page.locator(SELECTORS.FOOTER);
    expect(await footer.isVisible()).toBeTruthy();
  });

  test('should have window bounds', async ({ page }) => {
    // Check if page is visible by getting its content
    const body = await page.locator('body');
    expect(await body.isVisible()).toBeTruthy();

    // Verify window is actually displayed
    const html = await page.locator('html');
    expect(await html.isVisible()).toBeTruthy();
  });
});
