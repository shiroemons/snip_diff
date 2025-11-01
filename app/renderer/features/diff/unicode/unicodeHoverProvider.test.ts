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
