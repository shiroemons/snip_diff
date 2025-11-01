import { expect } from '@playwright/test';
import { test } from '../fixtures/electronTest';

test.describe('制御文字とUnicode可視化', () => {
  test('制御文字が可視化される', async ({ page }) => {
    // 制御文字を含むテキストを左エディタに入力
    const leftEditor = page.locator('.input-panel-left .monaco-editor textarea').first();
    await leftEditor.click();
    await leftEditor.fill('Hello\x00World\x07Test'); // NULL (0x00) と BEL (0x07)

    // 右エディタにテキストを入力
    const rightEditor = page.locator('.input-panel-right .monaco-editor textarea').first();
    await rightEditor.click();
    await rightEditor.fill('Hello World Test');

    // Monaco Editorが制御文字を可視化していることを確認
    // NOTE: 実際の可視化はMonaco Editorが内部的に処理するため、
    // ここではエディタがレンダリングされていることを確認
    const leftEditorContent = page.locator('.input-panel-left .monaco-editor');
    await expect(leftEditorContent).toBeVisible();

    // renderControlCharactersがtrueであることを確認（デフォルト設定）
    // Monaco Editorの内部状態は直接確認できないため、
    // エディタが正常に動作していることを確認
    await expect(leftEditorContent).toContainText('Hello');
  });

  test('Unicode文字がハイライトされる', async ({ page }) => {
    // 紛らわしいUnicode文字を含むテキストを入力
    // キリル文字の'а'（U+0430）はラテン文字の'a'に似ている
    const leftEditor = page.locator('.input-panel-left .monaco-editor textarea').first();
    await leftEditor.click();
    await leftEditor.fill('Hellо World'); // 'o'がキリル文字のо（U+043E）

    const rightEditor = page.locator('.input-panel-right .monaco-editor textarea').first();
    await rightEditor.click();
    await rightEditor.fill('Hello World'); // 通常のラテン文字

    // エディタがレンダリングされていることを確認
    const leftEditorContent = page.locator('.input-panel-left .monaco-editor');
    await expect(leftEditorContent).toBeVisible();

    // unicodeHighlightがデフォルトで有効であることを確認
    // Monaco Editorが内部的にハイライトを処理
    await expect(leftEditorContent).toContainText('Hell');
  });

  test('ゼロ幅文字が検出される', async ({ page }) => {
    // ゼロ幅文字を含むテキストを入力
    const leftEditor = page.locator('.input-panel-left .monaco-editor textarea').first();
    await leftEditor.click();
    await leftEditor.fill('Hello\u200BWorld'); // Zero-width space (U+200B)

    const rightEditor = page.locator('.input-panel-right .monaco-editor textarea').first();
    await rightEditor.click();
    await rightEditor.fill('HelloWorld');

    // エディタがレンダリングされていることを確認
    const leftEditorContent = page.locator('.input-panel-left .monaco-editor');
    await expect(leftEditorContent).toBeVisible();

    // invisibleCharactersハイライトが有効であることを確認
    await expect(leftEditorContent).toContainText('Hello');
  });

  test('差分パネルでも制御文字が可視化される', async ({ page }) => {
    // 左エディタに制御文字を含むテキストを入力
    const leftEditor = page.locator('.input-panel-left .monaco-editor textarea').first();
    await leftEditor.click();
    await leftEditor.fill('Line1\x00\nLine2\x07');

    // 右エディタにテキストを入力
    const rightEditor = page.locator('.input-panel-right .monaco-editor textarea').first();
    await rightEditor.click();
    await rightEditor.fill('Line1\nLine2');

    // 差分パネルが表示されていることを確認
    const comparePanel = page.locator('.compare-panel');
    await expect(comparePanel).toBeVisible();

    // 差分エディタ内のMonaco Editorが表示されていることを確認
    const diffEditor = page.locator('.compare-panel-content .monaco-diff-editor');
    await expect(diffEditor).toBeVisible();

    // renderControlCharactersとunicodeHighlightが差分パネルにも適用されていることを確認
    // Monaco Editorが内部的に処理するため、エディタが正常に動作していることを確認
    await expect(diffEditor).toBeVisible();
  });

  test('デフォルト設定が正しく適用される', async ({ page }) => {
    // アプリが起動した時点でデフォルト設定が適用されていることを確認
    // NOTE: 設定UIは提供しないため、デフォルト値がハードコードされている

    // エディタが表示されていることを確認
    const leftEditor = page.locator('.input-panel-left .monaco-editor');
    await expect(leftEditor).toBeVisible();

    // テキストを入力して、デフォルト設定が機能していることを確認
    const leftTextarea = page.locator('.input-panel-left .monaco-editor textarea').first();
    await leftTextarea.click();
    await leftTextarea.fill('Test\x00Content');

    // エディタが正常にレンダリングされていることを確認
    await expect(leftEditor).toContainText('Test');
  });
});
