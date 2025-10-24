# ライブラリアップデート計画

## 概要

このドキュメントは、SnipDiffプロジェクトの依存ライブラリを段階的にアップデートするための計画です。

### 現状

2025年10月時点で、多くのライブラリに大規模なバージョン差分があります：

- **React**: 18 → 19 (メジャーアップ)
- **Electron**: 28 → 38 (10バージョン差分)
- **Vite**: 5 → 7 (2メジャーアップ)
- **ESLint**: 8 → 9 (メジャーアップ)
- その他多数のメジャーバージョンアップ

### 基本方針

1. 各フェーズで動作確認とテストを徹底する
2. 問題が発生した場合は、そのフェーズで解決してから次へ進む
3. 各フェーズ完了後に必ずコミットする
4. リスクの低いものから順に実施

---

## Phase 1: 小規模な依存関係 🟡

**リスクレベル**: 低
**ステータス**: 部分的に完了
**ブランチ**: mainブランチで直接更新

### アップデート対象

| パッケージ | 現在 | 最新 | 実際 |
|-----------|------|------|------|
| @biomejs/biome | 2.2.6 | 2.3.0 | ✅ 2.3.0 |
| lucide-react | 0.546.0 | 0.547.0 | ⏸️ 0.546.0 |
| vite-plugin-electron | 0.28.8 | 0.29.0 | ✅ 0.29.0 |

### 実施した作業

```bash
# 1. アップデート実行（部分的）
npm update @biomejs/biome vite-plugin-electron

# 2. 型チェック
npm run type-check  # ✅ 成功

# 3. テスト実行
npm run test  # ✅ 223テスト通過

# 4. 開発モードで動作確認
npm run dev  # ✅ 正常動作
```

### 確認項目

- [x] 型エラーなし
- [x] テスト全通過（223テスト）
- [x] 開発モードで起動
- [x] 差分表示機能正常動作
- [ ] lucide-react 0.547.0へのアップデート（保留中）
- [x] Biome 2.3.0とvite-plugin-electron 0.29.0のコミット完了

### 注意点

- マイナーバージョンアップのため、破壊的変更はほぼなし ✅
- Biomeの新機能があれば設定で有効化を検討 → 特に破壊的変更なし
- lucide-reactは現在0.546.0のまま（0.547.0へのアップデートは次回検討）

---

## Phase 2: テスト環境 ✅

**リスクレベル**: 中
**ステータス**: 完了（2025-10-25）
**ブランチ**: `feature/phase2-vitest-update`

### アップデート対象

| パッケージ | 現在 | 最新 | 実際 |
|-----------|------|------|------|
| vitest | 3.2.4 | 4.0.2 | ✅ 4.0.3 |
| @vitest/coverage-v8 | 3.2.4 | 4.0.2 | ✅ 4.0.3 |

### 実施した作業

```bash
# 1. Vitest 4の破壊的変更を確認
# https://vitest.dev/guide/migration.html

# 2. アップデート実行
npm install -D vitest@4.0.3 @vitest/coverage-v8@4.0.3

# 3. 設定ファイル確認・修正
# - vitest.config.mtsのmonaco-editorエイリアスを修正
# - App.test.tsxにmonaco-editorとreactのモックを追加

# 4. テスト実行
npm run test -- --run  # 223テスト全通過

# 5. カバレッジ確認
npm run test:coverage  # 91.37%
```

### 確認項目

- [x] Vitest 4の破壊的変更を確認
- [x] 設定ファイル更新（monaco-editorエイリアスを正しいエントリーポイントに修正）
- [x] テスト全通過（223テスト）
- [x] カバレッジレポート生成成功（91.37%）
- [x] コミット完了（2コミット）

### 実施した変更

1. **vitest.config.mts**
   - monaco-editorのエイリアスをディレクトリから正しいエントリーポイント（esm/vs/editor/editor.main.js）に変更

2. **app/renderer/App.test.tsx**
   - monaco-editorのモックを追加
   - @monaco-editor/reactのモックを追加

3. **app/renderer/features/diff/DiffEditor.css**
   - CSS specificityの警告を修正（セレクタの順序を最適化）

### 注意点

- Vitest 4では設定形式やAPIに変更がある可能性 → **影響なし**（非推奨APIは未使用）
- テストが通らない場合は、テストコードの修正が必要 → **モック追加で対応完了**
- Vitest 4のV8カバレッジは、より正確なマッピングロジックを使用

---

## Phase 3: React生態系 🔴

**リスクレベル**: 高

### アップデート対象

| パッケージ | 現在 | 最新 |
|-----------|------|------|
| react | 18.3.1 | 19.2.0 |
| react-dom | 18.3.1 | 19.2.0 |
| @types/react | 18.3.26 | 19.2.2 |
| @types/react-dom | 18.3.7 | 19.2.2 |
| @testing-library/react | 16.3.0 | 最新確認 |

### React 19 主要変更点

- 新しいフック: `use()`, `useOptimistic()`, `useFormStatus()`, `useFormState()`
- Ref callback のクリーンアップ関数サポート
- `<Context>` を provider として直接使用可能
- Document Metadata サポート (`<title>`, `<meta>` 等)
- Stylesheet の優先度制御
- Async Script サポート
- リソースプリロード API

### 作業手順

```bash
# 1. React 19の変更内容を確認
# https://react.dev/blog/2024/12/05/react-19

# 2. アップデート実行
npm install react@19.2.0 react-dom@19.2.0
npm install -D @types/react@19.2.2 @types/react-dom@19.2.2

# 3. @testing-library/react を最新に更新
npm install -D @testing-library/react@latest

# 4. 型チェック
npm run type-check

# 5. 型エラーを修正（必要に応じて）

# 6. テスト実行
npm run test

# 7. 開発モードで動作確認
npm run dev

# 8. 全機能テスト
```

### 確認項目

- [ ] React 19の破壊的変更を確認
- [ ] 型エラーをすべて修正
- [ ] テスト全通過
- [ ] 開発モード起動確認
- [ ] 差分表示機能
- [ ] クリップボード機能
- [ ] ファイル保存/読み込み
- [ ] 設定画面
- [ ] テーマ切り替え
- [ ] キーボードショートカット
- [ ] コミット完了

### 注意点

- React 19は大きな変更があるため、慎重に進める
- 特に型定義の変更に注意
- `@testing-library/react`もReact 19対応版が必要

---

## Phase 4: Zustand & Monaco Editor 🟡

**リスクレベル**: 中

### アップデート対象

| パッケージ | 現在 | 最新 |
|-----------|------|------|
| zustand | 4.5.7 | 5.0.8 |
| monaco-editor | 0.45.0 | 0.54.0 |
| @monaco-editor/react | 4.6.0 | 最新確認 |

### Zustand 5 主要変更点

- ミドルウェアAPIの変更
- TypeScript型の改善
- パフォーマンス最適化

### 作業手順

```bash
# 1. Zustand 5の変更内容を確認
# https://github.com/pmndrs/zustand/releases

# 2. Monaco Editorの変更内容を確認
# https://github.com/microsoft/monaco-editor/releases

# 3. アップデート実行
npm install zustand@5.0.8 monaco-editor@0.54.0
npm install @monaco-editor/react@latest

# 4. 型チェック
npm run type-check

# 5. ストア定義の修正（必要に応じて）
# app/renderer/stores/diffStore.ts

# 6. テスト実行
npm run test

# 7. 開発モードで動作確認
npm run dev
```

### 確認項目

- [ ] Zustand 5の破壊的変更を確認
- [ ] Monaco Editorの変更を確認
- [ ] 型エラー修正
- [ ] ストアの動作確認 (`diffStore.ts`)
- [ ] DiffEditorコンポーネント正常動作
- [ ] 差分表示の視覚的な確認
- [ ] エディタのオプション変更機能
- [ ] テスト全通過
- [ ] コミット完了

### 注意点

- Monaco Editorは9マイナーバージョン差分があるため、API変更に注意
- エディタのレンダリングやパフォーマンスに影響がないか確認

---

## Phase 5: Electron 🔴

**リスクレベル**: 高

### アップデート対象

| パッケージ | 現在 | 最新 |
|-----------|------|------|
| electron | 28.3.3 | 38.4.0 |
| electron-builder | 24.13.3 | 26.0.12 |
| electron-store | 11.0.2 | 最新確認 |
| electron-updater | 6.6.2 | 最新確認 |

### Electron 29〜38 主要変更点を確認

各バージョンの Breaking Changes を確認：
- https://www.electronjs.org/docs/latest/breaking-changes

主な確認ポイント：
- API廃止・変更
- セキュリティポリシーの変更
- Node.js/Chromiumバージョン更新の影響

### 作業手順

```bash
# 1. Electron 29〜38の変更内容を確認

# 2. アップデート実行
npm install -D electron@38.4.0 electron-builder@26.0.12
npm install electron-store@latest electron-updater@latest

# 3. 型チェック
npm run type-check

# 4. メインプロセスの修正（必要に応じて）
# app/main/main.ts

# 5. プリロードスクリプトの確認
# app/preload/preload.ts

# 6. 開発モードで起動確認
npm run dev

# 7. 全機能テスト

# 8. ビルドテスト
npm run dist:mac

# 9. ビルドしたアプリを実際に実行してテスト
```

### 確認項目

- [ ] Electron 29〜38の破壊的変更を確認
- [ ] API変更に対応
- [ ] 型エラー修正
- [ ] 開発モード起動
- [ ] メインプロセスの動作確認
- [ ] IPC通信の動作確認
- [ ] クリップボード機能
- [ ] ファイルダイアログ
- [ ] 設定の永続化 (electron-store)
- [ ] 自動更新機能 (electron-updater)
- [ ] ウィンドウ制御
- [ ] システムテーマ取得
- [ ] ビルド成功
- [ ] ビルドしたアプリの実行確認
- [ ] コミット完了

### 注意点

- Electronは最も重要な依存関係のため、慎重に進める
- 10バージョン分の変更があるため、予期しない動作に注意
- ビルド後の実機テストを必ず実施
- セキュリティ設定 (contextIsolation, sandbox) に変更がないか確認

---

## Phase 6: Vite 🔴

**リスクレベル**: 高

### アップデート対象

| パッケージ | 現在 | 最新 |
|-----------|------|------|
| vite | 5.4.20 | 7.1.12 |
| @vitejs/plugin-react | 4.7.0 | 5.1.0 |

### Vite 6, 7 主要変更点を確認

- Vite 6: https://vitejs.dev/blog/announcing-vite6
- Vite 7: 最新のリリースノートを確認

主な確認ポイント：
- 設定ファイルの変更
- プラグインAPIの変更
- ビルド出力の変更
- 開発サーバーの動作変更

### 作業手順

```bash
# 1. Vite 6, 7の変更内容を確認

# 2. アップデート実行
npm install -D vite@7.1.12 @vitejs/plugin-react@5.1.0

# 3. 設定ファイルの更新（必要に応じて）
# vite.config.ts

# 4. 型チェック
npm run type-check

# 5. 開発サーバー起動確認
npm run dev:vite

# 6. HMR（Hot Module Replacement）動作確認

# 7. ビルド確認
npm run build:renderer

# 8. 本番ビルド確認
npm run dist:mac
```

### 確認項目

- [ ] Vite 6, 7の破壊的変更を確認
- [ ] vite.config.ts 更新（必要な場合）
- [ ] 型エラー修正
- [ ] 開発サーバー起動
- [ ] HMR正常動作
- [ ] ビルド成功
- [ ] Monaco Editorのchunk分割確認
- [ ] 本番ビルド成功
- [ ] ビルドしたアプリの実行確認
- [ ] コミット完了

### 注意点

- Vite 7は比較的新しいため、互換性問題に注意
- vite-plugin-electronとの互換性を確認
- ビルドサイズやパフォーマンスへの影響を確認

---

## Phase 7: Node.js型定義とユーティリティ 🟡

**リスクレベル**: 低〜中

### アップデート対象

| パッケージ | 現在 | 最新 |
|-----------|------|------|
| @types/node | 20.19.22 | 24.9.1 |
| concurrently | 8.2.2 | 9.2.1 |
| wait-on | 7.2.0 | 9.0.1 |
| typescript | 5.3.3 | 最新確認 |
| @types/diff | 7.0.2 | 最新確認 |

### 作業手順

```bash
# 1. TypeScript最新版を確認
# https://www.typescriptlang.org/docs/handbook/release-notes/overview.html

# 2. アップデート実行
npm install -D @types/node@24.9.1 concurrently@9.2.1 wait-on@9.0.1
npm install -D typescript@latest @types/diff@latest

# 3. tsconfig.json の確認・更新（必要に応じて）

# 4. 型チェック
npm run type-check

# 5. 型エラー修正

# 6. 開発スクリプトの動作確認
npm run dev

# 7. テスト実行
npm run test
```

### 確認項目

- [ ] TypeScriptの新バージョンを確認
- [ ] tsconfig.json更新（必要な場合）
- [ ] 型エラー修正
- [ ] 開発スクリプト正常動作
- [ ] concurrentlyによる並行起動確認
- [ ] wait-onによる待機処理確認
- [ ] テスト全通過
- [ ] コミット完了

### 注意点

- @types/nodeのメジャーアップデートにより、Node.js APIの型定義が変わる可能性
- TypeScriptの新しい厳密性チェックにより型エラーが増える可能性

---

## Phase 8 (オプション): ESLint対応 🟢

**リスクレベル**: 低（削除の場合）/ 中（アップデートの場合）

### オプションA: ESLint完全削除 ✅ 推奨

現在Biomeをメインで使用しているため、ESLintは不要。

#### 作業手順

```bash
# 1. ESLint関連パッケージをアンインストール
npm uninstall eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-react \
  eslint-plugin-react-hooks

# 2. 設定ファイル削除（存在する場合）
rm -f .eslintrc.* eslint.config.*

# 3. package.jsonからlintスクリプト確認
# 既にBiomeを使用しているため変更不要

# 4. 動作確認
npm run lint
npm run check
```

#### 確認項目

- [ ] ESLintパッケージ完全削除
- [ ] 設定ファイル削除
- [ ] Biomeのlintコマンド正常動作
- [ ] pre-commit/pre-pushフック正常動作
- [ ] コミット完了

---

### オプションB: ESLint 9へアップデート

ESLintを維持する場合（非推奨）。

#### アップデート対象

| パッケージ | 現在 | 最新 |
|-----------|------|------|
| eslint | 8.57.1 | 9.38.0 |
| @typescript-eslint/eslint-plugin | 6.21.0 | 8.46.2 |
| @typescript-eslint/parser | 6.21.0 | 8.46.2 |
| eslint-plugin-react-hooks | 4.6.2 | 7.0.0 |

#### 作業手順

```bash
# 1. ESLint 9 Flat Config形式を学習
# https://eslint.org/docs/latest/use/configure/configuration-files

# 2. アップデート実行
npm install -D eslint@9.38.0 \
  @typescript-eslint/eslint-plugin@8.46.2 \
  @typescript-eslint/parser@8.46.2 \
  eslint-plugin-react-hooks@7.0.0

# 3. Flat Config形式に移行
# .eslintrc.* を削除し、eslint.config.js を作成

# 4. Lint実行
npm run lint

# 5. 問題修正
npm run lint:fix
```

#### 確認項目

- [ ] Flat Config形式への移行完了
- [ ] Lint正常実行
- [ ] Lint errorなし
- [ ] コミット完了

---

## 全体の進捗管理

### フェーズ完了チェックリスト

- [x] Phase 1: 小規模な依存関係（🟡 部分的に完了、lucide-reactは保留中）
- [x] Phase 2: テスト環境（✅ 2025-10-25完了）
- [ ] Phase 3: React生態系
- [ ] Phase 4: Zustand & Monaco Editor
- [ ] Phase 5: Electron
- [ ] Phase 6: Vite
- [ ] Phase 7: Node.js型定義とユーティリティ
- [ ] Phase 8: ESLint対応

### 各フェーズ共通の確認項目

すべてのフェーズで以下を実施：

1. ✅ `npm run type-check` - 型エラーなし
2. ✅ `npm run lint` - リントエラーなし
3. ✅ `npm run test` - テスト全通過
4. ✅ `npm run dev` - 開発モード起動確認
5. ✅ `npm run build` - ビルド成功
6. ✅ 手動での機能テスト
7. ✅ Git commit

### 問題発生時の対応

1. **型エラー発生時**
   - エラーメッセージを確認
   - 公式ドキュメントでAPIの変更を確認
   - 必要に応じてコード修正

2. **テスト失敗時**
   - 失敗したテストを特定
   - ライブラリの変更による影響を調査
   - テストコードまたは実装コードを修正

3. **ビルド失敗時**
   - ビルドログを確認
   - 設定ファイルの見直し
   - 依存関係の互換性を確認

4. **実行時エラー発生時**
   - DevToolsでエラー詳細を確認
   - 該当機能の動作を再確認
   - 必要に応じてロールバック

---

## 参考リンク

### 公式ドキュメント

- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)
- [Electron Breaking Changes](https://www.electronjs.org/docs/latest/breaking-changes)
- [Vite Migration Guide](https://vitejs.dev/guide/migration.html)
- [TypeScript Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)
- [Zustand Releases](https://github.com/pmndrs/zustand/releases)
- [Monaco Editor Releases](https://github.com/microsoft/monaco-editor/releases)

### ツール

- [npm outdated](https://docs.npmjs.com/cli/v10/commands/npm-outdated)
- [npm-check-updates](https://www.npmjs.com/package/npm-check-updates)

---

## 更新履歴

- 2025-10-24: 初版作成
- 2025-10-25: Phase 1（小規模な依存関係）部分的に完了
  - @biomejs/biome 2.2.6 → 2.3.0
  - vite-plugin-electron 0.28.8 → 0.29.0
  - lucide-react 0.547.0へのアップデートは保留
- 2025-10-25: Phase 2（テスト環境）完了
  - vitest 3.2.4 → 4.0.3
  - @vitest/coverage-v8 3.2.4 → 4.0.3
  - 全223テスト通過、カバレッジ91.37%
