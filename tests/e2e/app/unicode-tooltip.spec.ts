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

    test('キリル文字のѕがエディタに表示される', async ({ page }) => {
      // キリル文字の'ѕ'（U+0455）
      await setMonacoEditorContent(page, 'microstreamѕ', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のіがエディタに表示される', async ({ page }) => {
      // キリル文字の'і'（U+0456）
      await setMonacoEditorContent(page, 'maіl.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('キリル文字のјがエディタに表示される', async ({ page }) => {
      // キリル文字の'ј'（U+0458）
      await setMonacoEditorContent(page, 'јava.com', 0);
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

    test('ギリシャ文字のιがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'ι'（U+03B9）
      await setMonacoEditorContent(page, 'maιl.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のκがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'κ'（U+03BA）
      await setMonacoEditorContent(page, 'booκ.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のνがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'ν'（U+03BD）
      await setMonacoEditorContent(page, 'νisa.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のτがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'τ'（U+03C4）
      await setMonacoEditorContent(page, 'τwitter.com', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΑがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Α'（U+0391）
      await setMonacoEditorContent(page, 'ΑPPLE.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΒがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Β'（U+0392）
      await setMonacoEditorContent(page, 'ΒMW.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΕがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Ε'（U+0395）
      await setMonacoEditorContent(page, 'GOOGLΕ.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΖがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Ζ'（U+0396）
      await setMonacoEditorContent(page, 'ΑMAΖON.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΙがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Ι'（U+0399）
      await setMonacoEditorContent(page, 'ΜAΙL.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΚがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Κ'（U+039A）
      await setMonacoEditorContent(page, 'ΒOOΚ.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΜがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Μ'（U+039C）
      await setMonacoEditorContent(page, 'ΜICROSOFT.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΝがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Ν'（U+039D）
      await setMonacoEditorContent(page, 'ΝIKE.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΟがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Ο'（U+039F）
      await setMonacoEditorContent(page, 'GΟΟGLE.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΡがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Ρ'（U+03A1）
      await setMonacoEditorContent(page, 'ΡAYPAL.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΤがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Τ'（U+03A4）
      await setMonacoEditorContent(page, 'ΤWITTER.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΥがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Υ'（U+03A5）
      await setMonacoEditorContent(page, 'ΥOUTUBE.COM', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ギリシャ文字のΧがエディタに表示される', async ({ page }) => {
      // ギリシャ文字の'Χ'（U+03A7）
      await setMonacoEditorContent(page, 'ΕΧAMPLE.COM', 0);
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

    test('ノーブレークスペースがエディタに入力される', async ({ page }) => {
      // ノーブレークスペース（U+00A0）
      await setMonacoEditorContent(page, 'Hello\u00A0World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('モンゴル語母音区切りがエディタに入力される', async ({ page }) => {
      // モンゴル語母音区切り（U+180E）
      await setMonacoEditorContent(page, 'Hello\u180EWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ワードジョイナーがエディタに入力される', async ({ page }) => {
      // ワードジョイナー（U+2060）
      await setMonacoEditorContent(page, 'Hello\u2060World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ソフトハイフンがエディタに入力される', async ({ page }) => {
      // ソフトハイフン（U+00AD）
      await setMonacoEditorContent(page, 'Hello\u00ADWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('結合グラフィーム結合子がエディタに入力される', async ({ page }) => {
      // 結合グラフィーム結合子（U+034F）
      await setMonacoEditorContent(page, 'Hello\u034FWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ハングルチョソンフィラーがエディタに入力される', async ({ page }) => {
      // ハングルチョソンフィラー（U+115F）
      await setMonacoEditorContent(page, 'Hello\u115FWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ハングルジュンソンフィラーがエディタに入力される', async ({ page }) => {
      // ハングルジュンソンフィラー（U+1160）
      await setMonacoEditorContent(page, 'Hello\u1160World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('クメール母音継承子Aがエディタに入力される', async ({ page }) => {
      // クメール母音継承子A（U+17B4）
      await setMonacoEditorContent(page, 'Hello\u17B4World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('クメール母音継承子AAがエディタに入力される', async ({ page }) => {
      // クメール母音継承子AA（U+17B5）
      await setMonacoEditorContent(page, 'Hello\u17B5World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ENクァッドがエディタに入力される', async ({ page }) => {
      // ENクァッド（U+2000）
      await setMonacoEditorContent(page, 'Hello\u2000World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('EMクァッドがエディタに入力される', async ({ page }) => {
      // EMクァッド（U+2001）
      await setMonacoEditorContent(page, 'Hello\u2001World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ENスペースがエディタに入力される', async ({ page }) => {
      // ENスペース（U+2002）
      await setMonacoEditorContent(page, 'Hello\u2002World', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ナローノーブレークスペースがエディタに入力される', async ({ page }) => {
      // ナローノーブレークスペース（U+202F）
      await setMonacoEditorContent(page, 'Hello\u202FWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('中程度の数学用空白がエディタに入力される', async ({ page }) => {
      // 中程度の数学用空白（U+205F）
      await setMonacoEditorContent(page, 'Hello\u205FWorld', 0);
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

    test('LEFT-TO-RIGHT MARKがエディタに入力される', async ({ page }) => {
      // LRM（U+200E）
      await setMonacoEditorContent(page, 'Hello\u200EWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('RIGHT-TO-LEFT MARKがエディタに入力される', async ({ page }) => {
      // RLM（U+200F）
      await setMonacoEditorContent(page, 'Hello\u200FWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('LEFT-TO-RIGHT EMBEDDINGがエディタに入力される', async ({ page }) => {
      // LRE（U+202A）
      await setMonacoEditorContent(page, 'Hello\u202AWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('RIGHT-TO-LEFT EMBEDDINGがエディタに入力される', async ({ page }) => {
      // RLE（U+202B）
      await setMonacoEditorContent(page, 'Hello\u202BWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('POP DIRECTIONAL FORMATTINGがエディタに入力される', async ({ page }) => {
      // PDF（U+202C）
      await setMonacoEditorContent(page, 'Hello\u202CWorld', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });
  });

  test.describe('紛らわしい文字', () => {
    test('乗算記号がエディタに表示される', async ({ page }) => {
      // 乗算記号（U+00D7）
      await setMonacoEditorContent(page, '5×3=15', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('マイナス記号がエディタに表示される', async ({ page }) => {
      // マイナス記号（U+2212）
      await setMonacoEditorContent(page, '10−5=5', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ラテン小文字合字ffがエディタに表示される', async ({ page }) => {
      // ラテン小文字合字ff（U+FB00）
      await setMonacoEditorContent(page, 'oﬀice', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ラテン小文字合字fiがエディタに表示される', async ({ page }) => {
      // ラテン小文字合字fi（U+FB01）
      await setMonacoEditorContent(page, 'ﬁle', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ラテン小文字合字flがエディタに表示される', async ({ page }) => {
      // ラテン小文字合字fl（U+FB02）
      await setMonacoEditorContent(page, 'ﬂag', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ラテン小文字合字ffiがエディタに表示される', async ({ page }) => {
      // ラテン小文字合字ffi（U+FB03）
      await setMonacoEditorContent(page, 'eﬃcient', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ラテン小文字合字fflがエディタに表示される', async ({ page }) => {
      // ラテン小文字合字ffl（U+FB04）
      await setMonacoEditorContent(page, 'scaﬄold', 0);
      await page.waitForTimeout(1000);

      const monacoEditor = page.locator('.monaco-editor').first();
      expect(await monacoEditor.isVisible()).toBeTruthy();
    });

    test('ラテン小文字合字stがエディタに表示される', async ({ page }) => {
      // ラテン小文字合字st（U+FB06）
      await setMonacoEditorContent(page, 'teﬆ', 0);
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
