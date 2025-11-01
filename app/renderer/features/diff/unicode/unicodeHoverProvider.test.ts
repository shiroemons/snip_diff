import type * as monaco from 'monaco-editor';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUnicodeHoverProvider } from './unicodeHoverProvider';

// Monaco Editorのモック
const mockMonaco = {
  Range: class MockRange {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
} as unknown as typeof monaco;

describe('unicodeHoverProvider', () => {
  let provider: monaco.languages.HoverProvider;

  beforeEach(() => {
    provider = createUnicodeHoverProvider(mockMonaco);
  });

  const createMockModel = (text: string): monaco.editor.ITextModel => {
    return {
      getValue: () => text,
      getOffsetAt: (position: monaco.Position) => {
        // 簡易的な実装: 1行目のみサポート
        return position.column - 1;
      },
    } as monaco.editor.ITextModel;
  };

  const createMockPosition = (column: number): monaco.Position => {
    return {
      lineNumber: 1,
      column,
    } as monaco.Position;
  };

  const createMockToken = (): monaco.CancellationToken => {
    return {
      isCancellationRequested: false,
      onCancellationRequested: vi.fn(),
    } as monaco.CancellationToken;
  };

  describe('キリル文字', () => {
    it('キリル文字の о (U+043E) に対してツールチップを返す', () => {
      const model = createMockModel('Hellо World'); // о はキリル文字
      const position = createMockPosition(5); // 'о' の位置
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents).toBeDefined();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+043E');
      expect(hover?.contents[0].value).toContain('ホモグラフ攻撃');
    });

    it('キリル文字の а (U+0430) に対してツールチップを返す', () => {
      const model = createMockModel('аpple'); // а はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0430');
    });

    it('キリル文字の е (U+0435) に対してツールチップを返す', () => {
      const model = createMockModel('googlе'); // е はキリル文字
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0435');
    });

    it('キリル文字の р (U+0440) に対してツールチップを返す', () => {
      const model = createMockModel('рaypal'); // р はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0440');
    });

    it('キリル文字の с (U+0441) に対してツールチップを返す', () => {
      const model = createMockModel('miсrosoft'); // с はキリル文字
      const position = createMockPosition(3);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0441');
    });

    it('キリル文字の х (U+0445) に対してツールチップを返す', () => {
      const model = createMockModel('eхample'); // х はキリル文字
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0445');
    });

    it('キリル文字の А (U+0410) に対してツールチップを返す', () => {
      const model = createMockModel('АPPLE.COM'); // А はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0410');
    });

    it('キリル文字の В (U+0412) に対してツールチップを返す', () => {
      const model = createMockModel('ВMW.COM'); // В はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0412');
    });

    it('キリル文字の Е (U+0415) に対してツールチップを返す', () => {
      const model = createMockModel('GOOGLЕ.COM'); // Е はキリル文字
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0415');
    });

    it('キリル文字の О (U+041E) に対してツールチップを返す', () => {
      const model = createMockModel('GООGLE.COM'); // О はキリル文字
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+041E');
    });

    it('キリル文字の Р (U+0420) に対してツールチップを返す', () => {
      const model = createMockModel('РAYPAL.COM'); // Р はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0420');
    });

    it('キリル文字の С (U+0421) に対してツールチップを返す', () => {
      const model = createMockModel('MIСROSOFT.COM'); // С はキリル文字
      const position = createMockPosition(3);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0421');
    });

    it('キリル文字の Х (U+0425) に対してツールチップを返す', () => {
      const model = createMockModel('ХELLO.COM'); // Х はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0425');
    });

    it('キリル文字の ѕ (U+0455) に対してツールチップを返す', () => {
      const model = createMockModel('microstreamѕ'); // ѕ はキリル文字
      const position = createMockPosition(12);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0455');
    });

    it('キリル文字の і (U+0456) に対してツールチップを返す', () => {
      const model = createMockModel('lіnkedin'); // і はキリル文字
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0456');
    });

    it('キリル文字の ј (U+0458) に対してツールチップを返す', () => {
      const model = createMockModel('јavascript'); // ј はキリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('キリル文字');
      expect(hover?.contents[0].value).toContain('U+0458');
    });
  });

  describe('ギリシャ文字', () => {
    it('ギリシャ文字の α (U+03B1) に対してツールチップを返す', () => {
      const model = createMockModel('αlpha'); // α はギリシャ文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03B1');
    });

    it('ギリシャ文字の β (U+03B2) に対してツールチップを返す', () => {
      const model = createMockModel('βeta');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03B2');
    });

    it('ギリシャ文字の ο (U+03BF) に対してツールチップを返す', () => {
      const model = createMockModel('gοοgle'); // ο はギリシャ文字
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03BF');
    });

    it('ギリシャ文字の ρ (U+03C1) に対してツールチップを返す', () => {
      const model = createMockModel('ρaypal');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03C1');
    });

    it('ギリシャ文字の ι (U+03B9) に対してツールチップを返す', () => {
      const model = createMockModel('maιl.com');
      const position = createMockPosition(3);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03B9');
    });

    it('ギリシャ文字の κ (U+03BA) に対してツールチップを返す', () => {
      const model = createMockModel('booκ.com');
      const position = createMockPosition(4);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03BA');
    });

    it('ギリシャ文字の ν (U+03BD) に対してツールチップを返す', () => {
      const model = createMockModel('νisa.com');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03BD');
    });

    it('ギリシャ文字の τ (U+03C4) に対してツールチップを返す', () => {
      const model = createMockModel('τwitter.com');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03C4');
    });

    it('ギリシャ文字の Α (U+0391) に対してツールチップを返す', () => {
      const model = createMockModel('ΑPPLE.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+0391');
    });

    it('ギリシャ文字の Β (U+0392) に対してツールチップを返す', () => {
      const model = createMockModel('ΒMW.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+0392');
    });

    it('ギリシャ文字の Ε (U+0395) に対してツールチップを返す', () => {
      const model = createMockModel('GOOGLΕ.COM');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+0395');
    });

    it('ギリシャ文字の Ζ (U+0396) に対してツールチップを返す', () => {
      const model = createMockModel('ΑMAΖON.COM');
      const position = createMockPosition(4);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+0396');
    });

    it('ギリシャ文字の Ι (U+0399) に対してツールチップを返す', () => {
      const model = createMockModel('ΙBM.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+0399');
    });

    it('ギリシャ文字の Κ (U+039A) に対してツールチップを返す', () => {
      const model = createMockModel('ΚDDI.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+039A');
    });

    it('ギリシャ文字の Μ (U+039C) に対してツールチップを返す', () => {
      const model = createMockModel('ΜICROSOFT.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+039C');
    });

    it('ギリシャ文字の Ν (U+039D) に対してツールチップを返す', () => {
      const model = createMockModel('ΝETFLIX.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+039D');
    });

    it('ギリシャ文字の Ο (U+039F) に対してツールチップを返す', () => {
      const model = createMockModel('GΟΟGLE.CΟM');
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+039F');
    });

    it('ギリシャ文字の Ρ (U+03A1) に対してツールチップを返す', () => {
      const model = createMockModel('ΡAYPAL.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03A1');
    });

    it('ギリシャ文字の Τ (U+03A4) に対してツールチップを返す', () => {
      const model = createMockModel('ΤWITTER.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03A4');
    });

    it('ギリシャ文字の Υ (U+03A5) に対してツールチップを返す', () => {
      const model = createMockModel('ΥAHOO.COM');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03A5');
    });

    it('ギリシャ文字の Χ (U+03A7) に対してツールチップを返す', () => {
      const model = createMockModel('EΧAMPLE.COM');
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ギリシャ文字');
      expect(hover?.contents[0].value).toContain('U+03A7');
    });
  });

  describe('不可視文字', () => {
    it('ゼロ幅スペース (U+200B) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u200BWorld'); // ゼロ幅スペース
      const position = createMockPosition(6); // ゼロ幅スペースの位置
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ゼロ幅スペース');
      expect(hover?.contents[0].value).toContain('U+200B');
    });

    it('ゼロ幅非結合子 (U+200C) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u200CWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ゼロ幅非結合子');
      expect(hover?.contents[0].value).toContain('U+200C');
    });

    it('ゼロ幅結合子 (U+200D) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u200DWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ゼロ幅結合子');
      expect(hover?.contents[0].value).toContain('U+200D');
    });

    it('BOM (U+FEFF) に対してツールチップを返す', () => {
      const model = createMockModel('\uFEFFHello');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('BOM');
      expect(hover?.contents[0].value).toContain('U+FEFF');
    });

    it('ノーブレークスペース (U+00A0) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u00A0World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ノーブレークスペース');
      expect(hover?.contents[0].value).toContain('U+00A0');
    });

    it('モンゴル語母音区切り (U+180E) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u180EWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('モンゴル語母音区切り');
      expect(hover?.contents[0].value).toContain('U+180E');
    });

    it('ワードジョイナー (U+2060) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u2060World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ワードジョイナー');
      expect(hover?.contents[0].value).toContain('U+2060');
    });

    it('ソフトハイフン (U+00AD) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u00ADWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ソフトハイフン');
      expect(hover?.contents[0].value).toContain('U+00AD');
    });

    it('Combining Grapheme Joiner (U+034F) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u034FWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('Combining Grapheme Joiner');
      expect(hover?.contents[0].value).toContain('U+034F');
    });

    it('ハングル初声フィラー (U+115F) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u115FWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ハングル初声フィラー');
      expect(hover?.contents[0].value).toContain('U+115F');
    });

    it('ハングル中声フィラー (U+1160) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u1160World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ハングル中声フィラー');
      expect(hover?.contents[0].value).toContain('U+1160');
    });

    it('クメール語固有母音Aq (U+17B4) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u17B4World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('クメール語固有母音Aq');
      expect(hover?.contents[0].value).toContain('U+17B4');
    });

    it('クメール語固有母音Aa (U+17B5) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u17B5World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('クメール語固有母音Aa');
      expect(hover?.contents[0].value).toContain('U+17B5');
    });

    it('En Quad (U+2000) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u2000World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('En Quad');
      expect(hover?.contents[0].value).toContain('U+2000');
    });

    it('Em Quad (U+2001) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u2001World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('Em Quad');
      expect(hover?.contents[0].value).toContain('U+2001');
    });

    it('En Space (U+2002) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u2002World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('En Space');
      expect(hover?.contents[0].value).toContain('U+2002');
    });

    it('狭いノーブレークスペース (U+202F) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u202FWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('狭いノーブレークスペース');
      expect(hover?.contents[0].value).toContain('U+202F');
    });

    it('中程度の数学用空白 (U+205F) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u205FWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('中程度の数学用空白');
      expect(hover?.contents[0].value).toContain('U+205F');
    });
  });

  describe('制御文字', () => {
    it('NULL (U+0000) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u0000World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('NULL');
      expect(hover?.contents[0].value).toContain('U+0000');
    });

    it('BEL (U+0007) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u0007World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('BEL');
      expect(hover?.contents[0].value).toContain('U+0007');
    });

    it('バックスペース (U+0008) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u0008World');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('バックスペース');
      expect(hover?.contents[0].value).toContain('U+0008');
    });

    it('ESC (U+001B) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u001BWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ESC');
      expect(hover?.contents[0].value).toContain('U+001B');
    });

    it('LTR OVERRIDE (U+202D) に対してツールチップを返す', () => {
      const model = createMockModel('photo\u202Dgpj.exe');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('LEFT-TO-RIGHT OVERRIDE');
      expect(hover?.contents[0].value).toContain('U+202D');
      expect(hover?.contents[0].value).toContain('ファイル名の偽装');
    });

    it('RTL OVERRIDE (U+202E) に対してツールチップを返す', () => {
      const model = createMockModel('report\u202Efdp.exe');
      const position = createMockPosition(7);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('RIGHT-TO-LEFT OVERRIDE');
      expect(hover?.contents[0].value).toContain('U+202E');
      expect(hover?.contents[0].value).toContain('RLO攻撃');
    });

    it('LRM (U+200E) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u200EWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('LEFT-TO-RIGHT MARK');
      expect(hover?.contents[0].value).toContain('U+200E');
    });

    it('RLM (U+200F) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u200FWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('RIGHT-TO-LEFT MARK');
      expect(hover?.contents[0].value).toContain('U+200F');
    });

    it('LRE (U+202A) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u202AWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('LEFT-TO-RIGHT EMBEDDING');
      expect(hover?.contents[0].value).toContain('U+202A');
    });

    it('RLE (U+202B) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u202BWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('RIGHT-TO-LEFT EMBEDDING');
      expect(hover?.contents[0].value).toContain('U+202B');
    });

    it('PDF (U+202C) に対してツールチップを返す', () => {
      const model = createMockModel('Hello\u202CWorld');
      const position = createMockPosition(6);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('POP DIRECTIONAL FORMATTING');
      expect(hover?.contents[0].value).toContain('U+202C');
    });
  });

  describe('紛らわしい文字', () => {
    it('乗算記号 (U+00D7) に対してツールチップを返す', () => {
      const model = createMockModel('ma×imum');
      const position = createMockPosition(3);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('乗算記号');
      expect(hover?.contents[0].value).toContain('U+00D7');
    });

    it('マイナス記号 (U+2212) に対してツールチップを返す', () => {
      const model = createMockModel('x−y');
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('マイナス記号');
      expect(hover?.contents[0].value).toContain('U+2212');
    });

    it('ラテン小文字合字 ff (U+FB00) に対してツールチップを返す', () => {
      const model = createMockModel('oﬀice');
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ラテン小文字合字 ff');
      expect(hover?.contents[0].value).toContain('U+FB00');
    });

    it('ラテン小文字合字 fi (U+FB01) に対してツールチップを返す', () => {
      const model = createMockModel('ﬁle');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ラテン小文字合字 fi');
      expect(hover?.contents[0].value).toContain('U+FB01');
    });

    it('ラテン小文字合字 fl (U+FB02) に対してツールチップを返す', () => {
      const model = createMockModel('ﬂag');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ラテン小文字合字 fl');
      expect(hover?.contents[0].value).toContain('U+FB02');
    });

    it('ラテン小文字合字 ffi (U+FB03) に対してツールチップを返す', () => {
      const model = createMockModel('eﬃcient');
      const position = createMockPosition(2);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ラテン小文字合字 ffi');
      expect(hover?.contents[0].value).toContain('U+FB03');
    });

    it('ラテン小文字合字 ffl (U+FB04) に対してツールチップを返す', () => {
      const model = createMockModel('scaﬄold');
      const position = createMockPosition(4);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ラテン小文字合字 ffl');
      expect(hover?.contents[0].value).toContain('U+FB04');
    });

    it('ラテン小文字合字 st (U+FB06) に対してツールチップを返す', () => {
      const model = createMockModel('teﬆ');
      const position = createMockPosition(3);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).not.toBeNull();
      expect(hover?.contents[0].value).toContain('ラテン小文字合字 st');
      expect(hover?.contents[0].value).toContain('U+FB06');
    });
  });

  describe('通常の文字', () => {
    it('通常のASCII文字に対してnullを返す', () => {
      const model = createMockModel('Hello World');
      const position = createMockPosition(1); // 'H' の位置
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).toBeNull();
    });

    it('日本語文字に対してnullを返す', () => {
      const model = createMockModel('こんにちは');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).toBeNull();
    });
  });

  describe('エッジケース', () => {
    it('範囲外のポジションに対してnullを返す', () => {
      const model = createMockModel('Hello');
      const position = createMockPosition(100); // 範囲外
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).toBeNull();
    });

    it('空文字列に対してnullを返す', () => {
      const model = createMockModel('');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover).toBeNull();
    });
  });

  describe('ツールチップの内容', () => {
    it('ツールチップにカテゴリラベルが含まれる', () => {
      const model = createMockModel('о'); // キリル文字
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover?.contents[0].value).toContain('紛らわしい文字');
    });

    it('ツールチップに説明が含まれる', () => {
      const model = createMockModel('о');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover?.contents[0].value).toContain('この文字はキリル文字');
    });

    it('ツールチップにセキュリティリスクが含まれる', () => {
      const model = createMockModel('о');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover?.contents[0].value).toContain('セキュリティリスク');
    });

    it('ツールチップに例が含まれる', () => {
      const model = createMockModel('о');
      const position = createMockPosition(1);
      const token = createMockToken();

      const hover = provider.provideHover(model, position, token) as monaco.languages.Hover;

      expect(hover?.contents[0].value).toContain('google.com');
    });
  });
});
