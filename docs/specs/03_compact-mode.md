# Compactモード 仕様書

## 概要

**Compactモード**は、SnipDiffの独自機能で、テキスト差分表示をより精密かつシンプルにするための表示モードです。通常の差分表示では行全体が背景色でハイライトされますが、Compactモードでは**実際に変更された文字だけ**を正確にハイライトすることで、視覚的なノイズを大幅に削減します。

## 目的と利点

### 1. 正確な差分の可視化
- **文字単位の精密ハイライト**: 行全体ではなく、実際に変更された文字だけをハイライト
- **共通部分の明確化**: 行内の変更されていない部分は通常表示され、変更箇所が一目瞭然

### 2. 視覚的なノイズの削減
- **行背景の削除**: 行全体の背景色を削除し、文字ハイライトのみに集中
- **シンプルな表示**: インジケータやOverview Rulerを非表示にして、差分コンテンツに集中

### 3. 効率的な差分確認
- **自動折りたたみ**: 変更されていない領域を自動的に折りたたみ、変更箇所だけを表示
- **スクロール削減**: 大きなファイルでも変更箇所がコンパクトに表示される

## 有効化方法

Compactモードは以下の3つの方法で有効化できます：

### 1. チェックボックス
- 差分表示パネルのヘッダーにある「Compact」チェックボックスをクリック
- チェックでオン、チェック解除でオフ

### 2. キーボードショートカット
- `⌘3` を押すことでオン/オフ切り替え

### 3. デフォルト設定
- 設定モーダルで「Compactモード」をデフォルトで有効にできる
- 起動時や新規セッション時に自動的にCompactモードになる

## 表示の違い

### 通常モード vs Compactモード

#### 例1: 単語の一部変更

**テキスト**:
- Before: `Hello World`
- After: `Hello Universe`

**通常モード（Side-by-Side）**:
```
┌──────────────────┬──────────────────┐
│ Hello World      │ Hello Universe   │
│ (行全体が赤背景)  │ (行全体が緑背景)  │
└──────────────────┴──────────────────┘
```

**Compactモード（Side-by-Side）**:
```
┌──────────────────┬──────────────────┐
│ Hello World      │ Hello Universe   │
│       ^^^^^ 赤   │       ^^^^^^^^ 緑│
└──────────────────┴──────────────────┘
```
- `Hello ` は通常表示（変更なし）
- `World` だけが赤くハイライト（削除）
- `Universe` だけが緑にハイライト（追加）

#### 例2: 行内の複数箇所変更

**テキスト**:
- Before: `const foo = "bar";`
- After: `let foo = "baz";`

**Compactモード**:
```
Before: const foo = "bar";
        ^^^^^ 赤     ^^^ 赤

After:  let foo = "baz";
        ^^^ 緑     ^^^ 緑
```
- `const` → `let` の変更が明確
- `"bar"` → `"baz"` の変更が明確
- 間の ` foo = ` は通常表示（変更なし）

#### 例3: 長い行の一部変更

**テキスト**:
```typescript
Before: function calculateTotalPrice(items, discount, tax) {
After:  function calculateFinalPrice(items, discount, tax, shipping) {
```

**Compactモード**:
```
Before: function calculateTotalPrice(items, discount, tax) {
                          ^^^^^ 赤

After:  function calculateFinalPrice(items, discount, tax, shipping) {
                          ^^^^^ 緑                       ^^^^^^^^^^ 緑
```
- 関数名の `Total` → `Final` の変更が明確
- 引数の追加 `shipping` が明確
- 他の部分は通常表示で、変更箇所だけが目立つ

## 技術的な仕組み

### 1. 差分計算

Compactモードでは、以下の2段階で差分を計算します：

#### ステップ1: 行レベルの差分
Monaco Editorが提供する `getLineChanges()` で行レベルの差分を取得

#### ステップ2: 文字レベルの詳細差分
各変更行について、`diffChars` ライブラリで文字単位の詳細な差分を計算

```typescript
// 例: "Hello World" vs "Hello Universe"
const charDiffs = diffChars(originalText, modifiedText);
// 結果:
// [
//   { value: "Hello ", removed: false, added: false },  // 共通
//   { value: "World", removed: true },                   // 削除
//   { value: "Universe", added: true }                   // 追加
// ]
```

### 2. デコレーション適用

計算された差分に基づいて、Monaco Editorのデコレーション機能で文字単位のハイライトを適用

```typescript
// 削除部分
{
  range: new Range(行, 開始列, 行, 終了列),
  options: {
    inlineClassName: 'compact-diff-delete',  // 赤下線 + 赤背景
  }
}

// 追加部分
{
  range: new Range(行, 開始列, 行, 終了列),
  options: {
    inlineClassName: 'compact-diff-insert',  // 緑下線 + 緑背景
  }
}
```

### 3. Unifiedモードの特殊処理

Unifiedモードでは、Monaco Editorが自動的にview-zone（削除行の表示領域）を作成します。Compactモードでは、このview-zone内のDOMを直接操作して、文字単位のハイライトを正確に適用します。

```typescript
// Unifiedモードの場合、DOMを直接操作
const charDeleteSpans = viewZone.querySelectorAll('.char-delete');
charDeleteSpans.forEach(span => {
  // spanを細かく分割してハイライトを適用
  charDiffs.forEach(part => {
    if (part.removed) {
      // 削除部分: char-deleteクラス付き
    } else {
      // 共通部分: char-deleteクラスなし
    }
  });
});
```

## Compactモード固有の設定

Compactモードを有効にすると、以下の設定が自動的に適用されます：

### 1. hideUnchangedRegions（変更されていない領域の折りたたみ）

**設定内容**:
```typescript
hideUnchangedRegions: {
  enabled: true,
  revealLineCount: 3,      // 展開時に表示する行数
  minimumLineCount: 3,     // 折りたたみの最小行数
  contextLineCount: 3,     // 変更箇所の前後に表示する行数
}
```

**動作**:
- 変更されていない領域が3行以上連続する場合、自動的に折りたたまれる
- 折りたたまれた領域は `...` で表示され、クリックで展開可能
- 変更箇所の前後3行は常に表示される

**例**:
```
  1  import React from 'react';
  2  import { useState } from 'react';
  3
... (20行省略) ...
 24  function MyComponent() {
 25    const [count, setCount] = useState(0);  // ← 変更行
 26    return <div>{count}</div>;
 27  }
... (10行省略) ...
```

### 2. renderIndicators（インジケータの非表示）

**通常モード**: 行頭に `+` や `-` のインジケータが表示される
**Compactモード**: インジケータを非表示にして、文字ハイライトだけに集中

### 3. renderOverviewRuler（Overview Rulerの非表示）

**通常モード**: 右端のスクロールバーに変更箇所のサマリーが表示される
**Compactモード**: Overview Rulerを非表示にして、画面をシンプル化

## スタイル定義

### ライトテーマ

```css
/* 削除部分 */
.compact-diff-delete {
  text-decoration: underline;
  text-decoration-color: #d73a49;  /* 赤下線 */
  text-decoration-thickness: 2px;
  background-color: rgba(255, 200, 200, 0.3);  /* 淡い赤背景 */
}

/* 追加部分 */
.compact-diff-insert {
  text-decoration: underline;
  text-decoration-color: #22863a;  /* 緑下線 */
  text-decoration-thickness: 2px;
  background-color: rgba(200, 255, 200, 0.3);  /* 淡い緑背景 */
}

/* 空行の削除 */
.compact-diff-empty-line-delete {
  background-color: rgba(255, 200, 200, 0.15);
}

/* 空行の追加 */
.compact-diff-empty-line-insert {
  background-color: rgba(200, 255, 200, 0.15);
}
```

### ダークテーマ

```css
/* 削除部分 */
.compact-diff-delete {
  text-decoration: underline;
  text-decoration-color: #f97583;  /* 赤下線 */
  text-decoration-thickness: 2px;
  background-color: rgba(255, 100, 100, 0.2);  /* 淡い赤背景 */
}

/* 追加部分 */
.compact-diff-insert {
  text-decoration: underline;
  text-decoration-color: #85e89d;  /* 緑下線 */
  text-decoration-thickness: 2px;
  background-color: rgba(100, 255, 100, 0.2);  /* 淡い緑背景 */
}

/* 空行の削除/追加 */
/* ライトテーマと同様の透明度で背景色を適用 */
```

## 使用シーン

### 推奨シーン

1. **細かいコード修正の確認**
   - 変数名の変更
   - 文字列の一部修正
   - 関数引数の追加/削除

2. **長い行の一部変更**
   - JSON/XMLの一部キー変更
   - URLやパスの一部修正
   - 長い文章の単語修正

3. **大量のコードで一部だけ変更**
   - 大きなファイルで数箇所だけ修正されたケース
   - 変更箇所だけに集中したい場合

### 通常モードを推奨するシーン

1. **大規模な行追加/削除**
   - 行単位の大きな変更が多い場合
   - 行全体の背景色で変更範囲を把握したい場合

2. **構造的な変更**
   - インデント変更
   - コードブロックの移動
   - 大幅なリファクタリング

## パフォーマンス考慮

### デコレーション管理

Compactモードでは、文字単位のデコレーションを大量に作成する可能性があるため、以下の最適化を実施：

1. **デコレーションコレクション**:
   - `createDecorationsCollection()` を使用して効率的に管理
   - 不要なデコレーションは即座にクリア

2. **差分更新時のみ再計算**:
   - `onDidUpdateDiff` イベントでのみデコレーションを更新
   - 不要な再計算を回避

3. **範囲の分割**:
   - 複数行にまたがる変更は単一行ごとに分割
   - Monaco Editorの制限に対応

### 大規模ファイルでの動作

- `hideUnchangedRegions` により、変更されていない領域は折りたたまれるため、パフォーマンスへの影響は限定的
- 数千行のファイルでも快適に動作

## トラブルシューティング

### ハイライトがずれる場合

**原因**: 特殊文字（絵文字、サロゲートペア）が含まれる場合、Monaco Editorの位置計算がずれることがある

**対処**:
1. 一度Compactモードをオフにしてオンにし直す
2. エディタの内容を再入力

### Unifiedモードで期待通りに表示されない

**原因**: DOM操作のタイミングによって、Monaco側のレンダリング前に処理される場合がある

**対処**:
- 内部で100msの遅延を設定済み
- 問題が発生する場合は、ビューモードを切り替えてみる

## 実装ファイル

Compactモード関連のコードは以下のファイルに実装されています：

- **hooks**: `app/renderer/features/diff/hooks/useCompactMode.ts`
  - デコレーション管理
  - 差分計算
  - DOM操作

- **themes**: `app/renderer/features/diff/themes/compactThemes.ts`
  - テーマ定義
  - スタイル設定

- **utils**: `app/renderer/features/diff/utils/diffUtils.ts`
  - ヘルパー関数
  - 範囲分割処理

- **CSS**: `app/renderer/features/diff/DiffEditor.css`
  - Compactモード用のスタイル定義
