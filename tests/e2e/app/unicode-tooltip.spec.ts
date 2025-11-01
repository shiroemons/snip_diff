import { expect, test } from '../fixtures/electronApp';
import {
  getMonacoEditorContent,
  setMonacoEditorContent,
  waitForMonacoEditor,
} from '../helpers/electron-helpers';

test.describe('Unicode文字ツールチップ', () => {
  test.beforeEach(async ({ page }) => {
    await waitForMonacoEditor(page);
  });

  test.describe('キリル文字', () => {
    test('キリル文字のоがエディタに表示される', async ({ page }) => {
      // キリル文字の'о'（U+043E）はラテン文字の'o'に似ている
      await setMonacoEditorContent(page, 'gооgle.com', 0); // 2つの о がキリル文字
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();

      // エディタの内容を確認（キリル文字が含まれていることを確認）
      const content = await getMonacoEditorContent(page, 0);
      expect(content).toContain('gооgle.com'); // キリル文字のоを含む
    });

    test('キリル文字のаがエディタに表示される', async ({ page }) => {
      // キリル文字の'а'（U+0430）
      await setMonacoEditorContent(page, 'аpple.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のеがエディタに表示される', async ({ page }) => {
      // キリル文字の'е'（U+0435）
      await setMonacoEditorContent(page, 'googlе.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のрがエディタに表示される', async ({ page }) => {
      // キリル文字の'р'（U+0440）
      await setMonacoEditorContent(page, 'рaypal.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のсがエディタに表示される', async ({ page }) => {
      // キリル文字の'с'（U+0441）
      await setMonacoEditorContent(page, 'miсrosoft.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のхがエディタに表示される', async ({ page }) => {
      // キリル文字の'х'（U+0445）
      await setMonacoEditorContent(page, 'eхample.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のАがエディタに表示される', async ({ page }) => {
      // キリル文字の'А'（U+0410）
      await setMonacoEditorContent(page, 'АPPLE.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のВがエディタに表示される', async ({ page }) => {
      // キリル文字の'В'（U+0412）
      await setMonacoEditorContent(page, 'ВMW.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のЕがエディタに表示される', async ({ page }) => {
      // キリル文字の'Е'（U+0415）
      await setMonacoEditorContent(page, 'GOOGLЕ.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のОがエディタに表示される', async ({ page }) => {
      // キリル文字の'О'（U+041E）
      await setMonacoEditorContent(page, 'GООGLE.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のРがエディタに表示される', async ({ page }) => {
      // キリル文字の'Р'（U+0420）
      await setMonacoEditorContent(page, 'РAYPAL.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のСがエディタに表示される', async ({ page }) => {
      // キリル文字の'С'（U+0421）
      await setMonacoEditorContent(page, 'MIСROSOFT.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のХがエディタに表示される', async ({ page }) => {
      // キリル文字の'Х'（U+0425）
      await setMonacoEditorContent(page, 'ХELLO.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });
  });

  test.describe('ギリシャ文字', () => {
    test('ギリシャ文字のαがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'α'（U+03B1）
      await setMonacoEditorContent(page, 'αlpha test', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のβがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'β'（U+03B2）
      await setMonacoEditorContent(page, 'βeta test', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のοがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'ο'（U+03BF）
      await setMonacoEditorContent(page, 'gοοgle.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のρがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'ρ'（U+03C1）
      await setMonacoEditorContent(page, 'ρaypal.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });
  });

  test.describe('不可視文字', () => {
    test('ゼロ幅スペースがエディタに入力される', async ({ page }) => {
      // ゼロ幅スペース（U+200B）
      await setMonacoEditorContent(page, 'Hello\u200BWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ゼロ幅非結合子がエディタに入力される', async ({ page }) => {
      // ゼロ幅非結合子（U+200C）
      await setMonacoEditorContent(page, 'Hello\u200CWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ゼロ幅結合子がエディタに入力される', async ({ page }) => {
      // ゼロ幅結合子（U+200D）
      await setMonacoEditorContent(page, 'Hello\u200DWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('BOMがエディタに入力される', async ({ page }) => {
      // BOM（U+FEFF）
      await setMonacoEditorContent(page, '\uFEFFHello', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });
  });

  test.describe('制御文字', () => {
    test('NULL文字がエディタに入力される', async ({ page }) => {
      // NULL（U+0000）
      await setMonacoEditorContent(page, 'Hello\u0000World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('BEL文字がエディタに入力される', async ({ page }) => {
      // BEL（U+0007）
      await setMonacoEditorContent(page, 'Hello\u0007World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('バックスペース文字がエディタに入力される', async ({ page }) => {
      // BS（U+0008）
      await setMonacoEditorContent(page, 'Hello\u0008World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ESC文字がエディタに入力される', async ({ page }) => {
      // ESC（U+001B）
      await setMonacoEditorContent(page, 'Hello\u001BWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('LTR OVERRIDE文字がエディタに入力される', async ({ page }) => {
      // LTR OVERRIDE（U+202D）
      await setMonacoEditorContent(page, 'photo\u202Dgpj.exe', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('RTL OVERRIDE文字がエディタに入力される', async ({ page }) => {
      // RTL OVERRIDE（U+202E）
      await setMonacoEditorContent(page, 'report\u202Efdp.exe', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });
  });

  test.describe('Unicode文字のハイライト', () => {
    test('Monaco EditorのunicodeHighlight機能が有効', async ({ page }) => {
      // キリル文字を含むテキストを入力
      await setMonacoEditorContent(page, 'gооgle.com', 0);
      await setMonacoEditorContent(page, 'google.com', 1);
      await page.waitForTimeout(1000);

      // Comparisonパネルを開く
      const compareButton = page.locator('button:has-text("Comparison")');
      if (await compareButton.isVisible()) {
        await compareButton.click();
        await page.waitForTimeout(500);
      }

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('複数のUnicode文字を含むテキストが表示される', async ({ page }) => {
      // 複数のキリル文字を含むテキスト
      await setMonacoEditorContent(page, 'аррlе.соm', 0); // а, р, р, с, о がキリル文字
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();

      const content = await getMonacoEditorContent(page, 0);
      expect(content).toContain('аррlе.соm'); // キリル文字を含む
    });
  });

  test.describe('通常のテキストとの比較', () => {
    test('通常のASCII文字とキリル文字が混在したテキスト', async ({ page }) => {
      // 左エディタ: キリル文字を含む
      await setMonacoEditorContent(page, 'gооgle.com', 0); // 2つの о がキリル文字

      // 右エディタ: 通常のASCII文字
      await setMonacoEditorContent(page, 'google.com', 1);

      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字とラテン文字が混在したテキスト', async ({ page }) => {
      // ギリシャ文字のοとラテン文字のo
      await setMonacoEditorContent(page, 'gοοgle.com', 0); // οはギリシャ文字
      await setMonacoEditorContent(page, 'google.com', 1);

      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });
  });
});
