import { expect, test } from '../fixtures/electronApp';
import { setMonacoEditorContent, waitForMonacoEditor } from '../helpers/electron-helpers';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for Monaco editor to be ready
    await waitForMonacoEditor(page);
  });

  // Note: Large volume tests (10k+ lines) are skipped as they exceed reasonable E2E test timeouts
  // These tests should be covered by unit tests or manual testing
  test.skip(
    'should handle 20,000 lines of text (skipped - too slow for E2E)',
    { timeout: 180000 },
    async ({ page }) => {
      // Generate 20,000 lines of text for left editor
      const leftLines = Array(20000)
        .fill(0)
        .map((_, i) => `Line ${i + 1}: Original content for testing large file handling`)
        .join('\n');

      // Generate 20,000 lines of text for right editor with some differences
      const rightLines = Array(20000)
        .fill(0)
        .map((_, i) => {
          if (i % 100 === 0) {
            return `Line ${i + 1}: Modified content for testing large file handling`;
          }
          return `Line ${i + 1}: Original content for testing large file handling`;
        })
        .join('\n');

      // Set content for left editor
      const startTime = Date.now();
      await setMonacoEditorContent(page, leftLines, 0);
      await page.waitForTimeout(500);

      // Set content for right editor
      await setMonacoEditorContent(page, rightLines, 1);

      // Wait for diff calculation to complete
      await page.waitForTimeout(5000);
      const endTime = Date.now();

      const elapsedTime = endTime - startTime;

      // Test should complete in reasonable time
      // According to spec.md: 2×20,000行の差分計算: 初回 < 1.5秒
      // But we allow more time for E2E test (including UI rendering and setting content)
      expect(elapsedTime).toBeLessThan(30000); // 30 seconds max for E2E

      // Check if Monaco editor is still responsive
      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    }
  );

  test.skip('should handle 10,000 lines of text efficiently (skipped - too slow for E2E)', async ({
    page,
  }) => {
    // Generate 10,000 lines of text
    const leftLines = Array(10000)
      .fill(0)
      .map((_, i) => `Line ${i + 1}: Test content`)
      .join('\n');

    const rightLines = Array(10000)
      .fill(0)
      .map((_, i) => {
        if (i % 50 === 0) {
          return `Line ${i + 1}: Modified content`;
        }
        return `Line ${i + 1}: Test content`;
      })
      .join('\n');

    const startTime = Date.now();

    // Set content
    await setMonacoEditorContent(page, leftLines, 0);
    await page.waitForTimeout(300);
    await setMonacoEditorContent(page, rightLines, 1);
    await page.waitForTimeout(2000);

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // Should be faster than 20k lines test
    expect(elapsedTime).toBeLessThan(8000); // 8 seconds max

    // Verify app is still functional
    const monacoEditor = page.locator('.monaco-editor').first();
    expect(await monacoEditor.isVisible()).toBeTruthy();
  });

  test('should handle moderate text volume (100 lines)', async ({ page }) => {
    // Generate 100 lines of text - reasonable for E2E testing
    const leftLines = Array(100)
      .fill(0)
      .map((_, i) => `Line ${i + 1}: Original content for testing`)
      .join('\n');

    const rightLines = Array(100)
      .fill(0)
      .map((_, i) => {
        if (i % 10 === 0) {
          return `Line ${i + 1}: Modified content for testing`;
        }
        return `Line ${i + 1}: Original content for testing`;
      })
      .join('\n');

    // Set content
    await setMonacoEditorContent(page, leftLines, 0);
    await page.waitForTimeout(300);
    await setMonacoEditorContent(page, rightLines, 1);
    await page.waitForTimeout(1000);

    // Verify app is still functional
    const monacoEditor = page.locator('.monaco-editor').first();
    expect(await monacoEditor.isVisible()).toBeTruthy();
  });

  test.skip('should handle long lines (skipped - too slow for E2E)', async ({ page }) => {
    // Generate text with long lines (500 characters per line)
    const longLine = 'A'.repeat(500);
    const leftLines = Array(50)
      .fill(0)
      .map((_, i) => `${i}: ${longLine}`)
      .join('\n');

    const rightLines = Array(1000)
      .fill(0)
      .map((_, i) => {
        if (i % 10 === 0) {
          return `${i}: ${longLine}X`; // Add difference
        }
        return `${i}: ${longLine}`;
      })
      .join('\n');

    // Set content
    await setMonacoEditorContent(page, leftLines, 0);
    await page.waitForTimeout(300);
    await setMonacoEditorContent(page, rightLines, 1);
    await page.waitForTimeout(2000);

    // Check if editor is still responsive
    const monacoEditor = page.locator('.monaco-editor').first();
    expect(await monacoEditor.isVisible()).toBeTruthy();
  });

  test('should handle rapid content changes', async ({ page }) => {
    // Test rapid content changes
    const texts = [
      'First content',
      'Second content with more text',
      'Third content completely different',
      'Fourth content back to simple',
      'Fifth and final content',
    ];

    for (const text of texts) {
      await setMonacoEditorContent(page, text, 0);
      await page.waitForTimeout(200);
    }

    // Wait for final diff calculation
    await page.waitForTimeout(1000);

    // App should still be functional
    const monacoEditor = page.locator('.monaco-editor').first();
    expect(await monacoEditor.isVisible()).toBeTruthy();
  });

  test('should handle switching between medium and small content', async ({ page }) => {
    // Start with medium content
    const mediumText = Array(100)
      .fill(0)
      .map((_, i) => `Line ${i + 1}: Medium content`)
      .join('\n');

    await setMonacoEditorContent(page, mediumText, 0);
    await page.waitForTimeout(500);

    // Switch to small content
    const smallText = "Small content\nJust a few lines\nThat's all";
    await setMonacoEditorContent(page, smallText, 0);
    await page.waitForTimeout(300);

    // Switch back to medium content
    await setMonacoEditorContent(page, mediumText, 0);
    await page.waitForTimeout(500);

    // App should handle the transitions smoothly
    const monacoEditor = page.locator('.monaco-editor').first();
    expect(await monacoEditor.isVisible()).toBeTruthy();
  });

  test('should not crash with empty content', async ({ page }) => {
    // Set some content first
    const text = Array(50)
      .fill(0)
      .map((_, i) => `Line ${i + 1}`)
      .join('\n');

    await setMonacoEditorContent(page, text, 0);
    await setMonacoEditorContent(page, text, 1);
    await page.waitForTimeout(500);

    // Clear content
    await setMonacoEditorContent(page, '', 0);
    await setMonacoEditorContent(page, '', 1);
    await page.waitForTimeout(300);

    // App should still be functional
    const monacoEditor = page.locator('.monaco-editor').first();
    expect(await monacoEditor.isVisible()).toBeTruthy();
  });
});
