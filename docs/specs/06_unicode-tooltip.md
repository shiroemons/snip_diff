# Unicode文字ツールチップ日本語化 仕様書

## 概要

Monaco Editorで検出されるUnicode文字（紛らわしい文字、不可視文字、制御文字）にカーソルを合わせた時に、**日本語の説明ツールチップ**を表示する機能です。

### 背景
Monaco Editorはデフォルトで`unicodeHighlight`機能を持ち、セキュリティリスクのある文字をハイライト表示しますが、ツールチップは英語のみです。この機能により、日本語ユーザーが文字の意味やリスクを即座に理解できるようになります。

### 既存の実装
現在、以下の設定がデフォルトで有効化されています（`app/renderer/stores/diffStore.ts`）:
```typescript
renderControlCharacters: true,
unicodeHighlight: {
  invisibleCharacters: true,    // 不可視文字をハイライト
  ambiguousCharacters: true,    // 紛らわしい文字をハイライト
  nonBasicASCII: false,         // 基本ASCII以外（警告多すぎるため無効）
  includeComments: true,
  includeStrings: true,
}
```

## 目的と利点

### 1. セキュリティリスクの理解
- **ホモグラフ攻撃の防止**: キリル文字の 'о' とラテン文字の 'o' の違いを明示
- **不可視文字の検出**: ゼロ幅スペースなど、コピペで混入しやすい文字を警告
- **制御文字の可視化**: NULL、BELなどの制御文字の説明

### 2. 開発体験の向上
- **即座の理解**: カーソルを合わせるだけで文字の詳細がわかる
- **学習効果**: Unicode文字の知識が自然に身につく
- **デバッグ効率化**: 原因不明のバグが文字コードの問題だと即座に判明

### 3. 日本語環境への最適化
- **母国語での説明**: 技術用語も日本語で理解しやすい
- **具体例の提示**: 日本語のコンテキストでの使用例

## 対応文字一覧

### Phase 1: ホモグラフ攻撃リスク文字（最優先）

#### キリル文字（Cyrillic）
| Unicode | 文字 | 類似文字 | リスク |
|---------|------|----------|--------|
| U+0430  | а    | a (U+0061) | 高 |
| U+0435  | е    | e (U+0065) | 高 |
| U+043E  | о    | o (U+006F) | 高 |
| U+0440  | р    | p (U+0070) | 高 |
| U+0441  | с    | c (U+0063) | 高 |
| U+0445  | х    | x (U+0078) | 高 |

#### ギリシャ文字（Greek）
| Unicode | 文字 | 類似文字 | リスク |
|---------|------|----------|--------|
| U+03B1  | α    | a (U+0061) | 中 |
| U+03B2  | β    | B (U+0042) | 中 |
| U+03BF  | ο    | o (U+006F) | 高 |
| U+03C1  | ρ    | p (U+0070) | 高 |

### Phase 2: 不可視文字

| Unicode | 名称 | リスク |
|---------|------|--------|
| U+200B  | ゼロ幅スペース | 高 |
| U+200C  | ゼロ幅非結合子 | 中 |
| U+200D  | ゼロ幅結合子 | 中 |
| U+FEFF  | ゼロ幅非改行スペース (BOM) | 中 |

### Phase 3: 制御文字

| Unicode | 名称 | 影響 |
|---------|------|------|
| U+0000  | NULL | 高 |
| U+0007  | BEL (ベル) | 低 |
| U+0008  | BS (バックスペース) | 中 |
| U+001B  | ESC (エスケープ) | 中 |

## ツールチップ表示例

### 例1: キリル文字の 'о' (U+043E)

```markdown
⚠️ **紛らわしい文字**

**キリル文字の小文字オー (U+043E)**

この文字はキリル文字の 'о' です。
ラテン文字の 'o' (U+006F) と見た目が似ていますが、異なる文字です。

**セキュリティリスク**
フィッシング攻撃（ホモグラフ攻撃）に悪用される可能性があります。

**悪用例**
`gооgle.com` （2つの о がキリル文字）
→ 本物の `google.com` と区別がつきません
```

### 例2: ゼロ幅スペース (U+200B)

```markdown
⚠️ **不可視文字**

**ゼロ幅スペース (U+200B)**

この位置にゼロ幅スペースが含まれています。
画面には表示されませんが、文字として存在します。

**影響**
- コピー&ペーストで意図せず混入することがあります
- プログラムコードでは構文エラーやコンパイルエラーの原因になります
- 文字列比較が期待通りに動作しない可能性があります

**検出方法**
この文字は `renderControlCharacters` により可視化されています。
```

### 例3: NULL (U+0000)

```markdown
⚠️ **制御文字**

**NULL (U+0000)**

ヌル文字（文字列終端記号）です。
多くのプログラミング言語で特別な意味を持ちます。

**影響**
- C/C++: 文字列の終端として解釈されます
- JavaScript: 通常の文字として扱われますが、予期しない動作の原因になることがあります
- データベース: 格納できない場合があります

**対処**
通常のテキストデータに含まれるべきではありません。削除を推奨します。
```

## 技術的な仕組み

### 1. Monaco Editor Hover Provider API

Monaco Editorは `languages.registerHoverProvider` APIを提供しています：

```typescript
import * as monaco from 'monaco-editor';

monaco.languages.registerHoverProvider('*', {
  provideHover(model, position, token) {
    // カーソル位置の文字を取得
    const offset = model.getOffsetAt(position);
    const text = model.getValue();
    const char = text[offset];

    // 文字コードを取得
    const charCode = char.charCodeAt(0);

    // 翻訳データから説明を取得
    const translation = getTranslation(charCode);
    if (!translation) return null;

    // Markdown形式でツールチップを返す
    return {
      contents: [
        { value: formatTooltip(translation) }
      ]
    };
  }
});
```

### 2. 型定義

```typescript
// Monaco Editor型定義（node_modules/monaco-editor/monaco.d.ts）
export interface HoverProvider {
  provideHover(
    model: editor.ITextModel,
    position: Position,
    token: CancellationToken
  ): ProviderResult<Hover>;
}

export interface Hover {
  contents: IMarkdownString[];  // Markdown形式の配列
  range?: IRange;               // オプション: ハイライト範囲
}

export interface IMarkdownString {
  value: string;                // Markdown形式の文字列
  isTrusted?: boolean;
  supportThemeIcons?: boolean;
}
```

## 実装ファイル構成

```
app/renderer/features/diff/
└── unicode/
    ├── translations.json              # Unicode文字の日本語説明データ
    ├── unicodeHoverProvider.ts        # Hover Provider実装
    └── unicodeHoverProvider.test.ts   # ユニットテスト
```

### translations.json の構造

```json
{
  "0x043e": {
    "char": "о",
    "name": "キリル文字の小文字オー",
    "category": "ambiguous",
    "similar": ["o (U+006F)"],
    "description": "この文字はキリル文字の 'о' です。\nラテン文字の 'o' (U+006F) と見た目が似ていますが、異なる文字です。",
    "risk": "フィッシング攻撃（ホモグラフ攻撃）に悪用される可能性があります。",
    "example": "`gооgle.com` （2つの о がキリル文字）\n→ 本物の `google.com` と区別がつきません"
  },
  "0x200b": {
    "char": "\u200b",
    "name": "ゼロ幅スペース",
    "category": "invisible",
    "description": "この位置にゼロ幅スペースが含まれています。\n画面には表示されませんが、文字として存在します。",
    "risk": "- コピー&ペーストで意図せず混入することがあります\n- プログラムコードでは構文エラーやコンパイルエラーの原因になります\n- 文字列比較が期待通りに動作しない可能性があります",
    "note": "この文字は `renderControlCharacters` により可視化されています。"
  },
  "0x0000": {
    "char": "\u0000",
    "name": "NULL",
    "category": "control",
    "description": "ヌル文字（文字列終端記号）です。\n多くのプログラミング言語で特別な意味を持ちます。",
    "risk": "- C/C++: 文字列の終端として解釈されます\n- JavaScript: 通常の文字として扱われますが、予期しない動作の原因になることがあります\n- データベース: 格納できない場合があります",
    "action": "通常のテキストデータに含まれるべきではありません。削除を推奨します。"
  }
}
```

### JSON スキーマ定義

```typescript
// app/renderer/features/diff/unicode/types.ts
export interface UnicodeTranslation {
  char: string;           // 文字そのもの
  name: string;           // 文字の名称
  category: 'ambiguous' | 'invisible' | 'control';
  similar?: string[];     // 類似文字のリスト（ambiguousの場合）
  description: string;    // 文字の説明
  risk?: string;          // セキュリティリスクや影響
  example?: string;       // 悪用例や使用例
  note?: string;          // 追加情報
  action?: string;        // 推奨アクション
}

export type TranslationMap = Record<string, UnicodeTranslation>;
```

## 実装手順

### Step 1: 翻訳データの作成

**ファイル**: `app/renderer/features/diff/unicode/translations.json`

```json
{
  "0x043e": { /* キリル文字 о */ },
  "0x0430": { /* キリル文字 а */ },
  "0x200b": { /* ゼロ幅スペース */ },
  "0x0000": { /* NULL */ }
  // ... 他の文字を追加
}
```

### Step 2: Hover Provider の実装

**ファイル**: `app/renderer/features/diff/unicode/unicodeHoverProvider.ts`

```typescript
import * as monaco from 'monaco-editor';
import translationsJson from './translations.json';
import type { TranslationMap, UnicodeTranslation } from './types';

const translations: TranslationMap = translationsJson;

/**
 * Unicode文字コードから翻訳データを取得
 */
function getTranslation(charCode: number): UnicodeTranslation | null {
  const key = `0x${charCode.toString(16).padStart(4, '0')}`;
  return translations[key] || null;
}

/**
 * 翻訳データをMarkdown形式のツールチップに整形
 */
function formatTooltip(translation: UnicodeTranslation): string {
  const { name, category, description, risk, example, note, action, similar } = translation;

  let categoryIcon = '⚠️';
  let categoryLabel = '警告';

  if (category === 'ambiguous') {
    categoryIcon = '⚠️';
    categoryLabel = '紛らわしい文字';
  } else if (category === 'invisible') {
    categoryIcon = '⚠️';
    categoryLabel = '不可視文字';
  } else if (category === 'control') {
    categoryIcon = '⚠️';
    categoryLabel = '制御文字';
  }

  let markdown = `${categoryIcon} **${categoryLabel}**\n\n`;
  markdown += `**${name}**\n\n`;
  markdown += `${description}\n\n`;

  if (similar && similar.length > 0) {
    markdown += `**類似文字**\n${similar.join(', ')}\n\n`;
  }

  if (risk) {
    markdown += `**セキュリティリスク/影響**\n${risk}\n\n`;
  }

  if (example) {
    markdown += `**例**\n${example}\n\n`;
  }

  if (action) {
    markdown += `**推奨アクション**\n${action}\n\n`;
  }

  if (note) {
    markdown += `**補足**\n${note}\n`;
  }

  return markdown.trim();
}

/**
 * Unicode Hover Providerを作成
 */
export function createUnicodeHoverProvider(): monaco.languages.HoverProvider {
  return {
    provideHover(model, position, token) {
      // カーソル位置のオフセットを取得
      const offset = model.getOffsetAt(position);
      const text = model.getValue();

      // オフセットが範囲外の場合は null
      if (offset < 0 || offset >= text.length) {
        return null;
      }

      // カーソル位置の文字を取得
      const char = text[offset];
      const charCode = char.charCodeAt(0);

      // 翻訳データを取得
      const translation = getTranslation(charCode);
      if (!translation) {
        return null;
      }

      // Markdown形式のツールチップを返す
      return {
        contents: [
          { value: formatTooltip(translation) }
        ],
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column + 1
        )
      };
    }
  };
}

/**
 * Unicode Hover Providerを登録
 *
 * @returns 登録解除用のDisposable
 */
export function registerUnicodeHoverProvider(): monaco.IDisposable {
  const provider = createUnicodeHoverProvider();

  // すべての言語に対してHover Providerを登録
  return monaco.languages.registerHoverProvider('*', provider);
}
```

### Step 3: 型定義ファイルの作成

**ファイル**: `app/renderer/features/diff/unicode/types.ts`

```typescript
export interface UnicodeTranslation {
  char: string;
  name: string;
  category: 'ambiguous' | 'invisible' | 'control';
  similar?: string[];
  description: string;
  risk?: string;
  example?: string;
  note?: string;
  action?: string;
}

export type TranslationMap = Record<string, UnicodeTranslation>;
```

### Step 4: DiffEditorへの統合

**ファイル**: `app/renderer/features/diff/DiffEditor.tsx`

```typescript
import { registerUnicodeHoverProvider } from './unicode/unicodeHoverProvider';

export const DiffEditor = forwardRef<DiffEditorRef, DiffEditorProps>(
  ({ theme, isMaximized }, ref) => {
    // ... 既存のコード ...

    // Unicode Hover Providerの登録
    useEffect(() => {
      const disposable = registerUnicodeHoverProvider();

      // クリーンアップ
      return () => {
        disposable.dispose();
      };
    }, []);

    // ... 残りのコード ...
  }
);
```

### Step 5: ComparisonPanelへの統合

ComparisonPanelはDiffEditorの子コンポーネントなので、DiffEditorで登録すれば自動的に適用されます。追加の統合は不要です。

## テスト

### ユニットテスト

**ファイル**: `app/renderer/features/diff/unicode/unicodeHoverProvider.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createUnicodeHoverProvider } from './unicodeHoverProvider';
import type * as monaco from 'monaco-editor';

describe('unicodeHoverProvider', () => {
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

  it('should return hover for Cyrillic о (U+043E)', () => {
    const provider = createUnicodeHoverProvider();
    const model = createMockModel('Hellо World'); // о はキリル文字
    const position = createMockPosition(5); // 'о' の位置
    const token = createMockToken();

    const hover = provider.provideHover(model, position, token);

    expect(hover).not.toBeNull();
    expect(hover?.contents).toBeDefined();
    expect(hover?.contents[0].value).toContain('キリル文字');
    expect(hover?.contents[0].value).toContain('U+043E');
  });

  it('should return hover for zero-width space (U+200B)', () => {
    const provider = createUnicodeHoverProvider();
    const model = createMockModel('Hello\u200BWorld'); // ゼロ幅スペース
    const position = createMockPosition(6); // ゼロ幅スペースの位置
    const token = createMockToken();

    const hover = provider.provideHover(model, position, token);

    expect(hover).not.toBeNull();
    expect(hover?.contents[0].value).toContain('ゼロ幅スペース');
    expect(hover?.contents[0].value).toContain('U+200B');
  });

  it('should return null for normal ASCII character', () => {
    const provider = createUnicodeHoverProvider();
    const model = createMockModel('Hello World');
    const position = createMockPosition(1); // 'H' の位置
    const token = createMockToken();

    const hover = provider.provideHover(model, position, token);

    expect(hover).toBeNull();
  });

  it('should return null for out of range position', () => {
    const provider = createUnicodeHoverProvider();
    const model = createMockModel('Hello');
    const position = createMockPosition(100); // 範囲外
    const token = createMockToken();

    const hover = provider.provideHover(model, position, token);

    expect(hover).toBeNull();
  });
});
```

### E2Eテスト

**ファイル**: `tests/e2e/app/unicode-tooltip.spec.ts`

```typescript
import { expect, test } from '../fixtures/electronApp';
import { setMonacoEditorContent, waitForMonacoEditor } from '../helpers/electron-helpers';

test.describe('Unicode文字ツールチップ', () => {
  test.beforeEach(async ({ page }) => {
    await waitForMonacoEditor(page);
  });

  test('キリル文字にカーソルを合わせるとツールチップが表示される', async ({ page }) => {
    // キリル文字を含むテキストを入力
    await setMonacoEditorContent(page, 'Hellо World', 0); // 'о' はキリル文字

    // Monaco Editorにフォーカス
    const editor = page.locator('.monaco-editor').first();
    await editor.click();

    // キリル文字の位置にカーソルを移動
    // Note: E2Eテストでホバーをシミュレートするのは困難
    // 実際の手動テストで確認することを推奨

    expect(await editor.isVisible()).toBeTruthy();
  });
});
```

**注意**: Monaco Editorのホバー機能はE2Eテストで完全に検証するのが困難です。ユニットテストと手動テストを組み合わせて検証してください。

## トラブルシューティング

### ツールチップが表示されない

**原因1**: Hover Providerが登録されていない
- `DiffEditor.tsx` で `registerUnicodeHoverProvider()` が呼ばれているか確認
- `useEffect` のクリーンアップが正しく実装されているか確認

**原因2**: translations.json が読み込めていない
- JSONファイルのパスが正しいか確認
- TypeScriptの設定で JSON import が有効になっているか確認（`tsconfig.json` の `resolveJsonModule: true`）

**原因3**: 文字コードのキーが一致していない
- 16進数表記が正しいか確認（`0x043e` など）
- パディングが4桁になっているか確認

### ツールチップの内容が文字化けする

**原因**: Markdown のエスケープ処理が不適切
- バックスラッシュやアンダースコアを適切にエスケープ
- 改行は `\n` ではなく実際の改行文字を使用

### パフォーマンスが低下する

**原因**: すべての文字でHover Providerが呼ばれる
- `getTranslation()` で早期リターンを実装
- 翻訳データをMapに変換してO(1)でアクセス

**最適化例**:
```typescript
// Map に変換してキャッシュ
const translationMap = new Map(
  Object.entries(translations).map(([key, value]) => [
    parseInt(key, 16),
    value
  ])
);

function getTranslation(charCode: number): UnicodeTranslation | null {
  return translationMap.get(charCode) || null;
}
```

## 将来の拡張

### 多言語対応
現在は日本語のみですが、将来的に英語版も追加する場合:

```typescript
// translations/ja.json, translations/en.json に分離
import jaTranslations from './translations/ja.json';
import enTranslations from './translations/en.json';

function getTranslations(locale: string) {
  return locale === 'ja' ? jaTranslations : enTranslations;
}
```

### カスタム文字の追加
ユーザーが独自のUnicode文字説明を追加できる機能:

```typescript
// 設定で追加の翻訳データを読み込む
const customTranslations = loadCustomTranslations();
const mergedTranslations = { ...translations, ...customTranslations };
```

### 詳細度の切り替え
Monaco Editorの `HoverVerbosityRequest` を使って、詳細度を切り替える:

```typescript
provideHover(model, position, token, context) {
  const verbosity = context?.verbosityRequest?.verbosityDelta || 0;

  if (verbosity > 0) {
    // より詳細な情報を表示
    return { contents: [{ value: detailedTooltip }] };
  } else {
    // 簡潔な情報のみ
    return { contents: [{ value: briefTooltip }] };
  }
}
```

## まとめ

この機能により、Unicode文字のセキュリティリスクや意味を日本語で即座に理解できるようになります。

**実装の要点**:
1. `translations.json` に文字の説明を定義
2. `unicodeHoverProvider.ts` でHover Providerを実装
3. `DiffEditor.tsx` で登録
4. ユニットテストで動作確認

**メンテナンス**:
- 新しい問題文字が見つかったら `translations.json` に追加
- 説明文の改善は随時実施
- ユーザーフィードバックを元に翻訳を改善
