# SnipDiff

未保存テキスト差分ビューア - GitHub-like diff viewer for unsaved text

## 概要

SnipDiffは、保存していないテキスト同士の差分を、GitHubのdiffに近いUIで高速・安全・オフラインに確認できるmacOSデスクトップアプリケーションです。

## 主な機能

- **未保存テキストの差分表示**: クリップボードやドラッグ&ドロップで簡単に差分を確認
- **GitHubライクなUI**: Unified/Side-by-sideの2モードをサポート
- **高速動作**: 起動から差分表示まで1秒未満
- **オフライン動作**: ネットワーク接続不要、完全にローカルで動作
- **Monaco Editor**: VS Codeと同じエディタエンジンを使用
- **柔軟なオプション**: 空白無視、改行コード差異の無視、ケース無視など

## セットアップ

### 必要要件

- Node.js 18以上
- macOS (Apple Silicon/Intel)

### インストール

```bash
npm install
```

### 開発

```bash
npm run dev
```

### ビルド

```bash
npm run build
npm run dist:mac
```

## 技術スタック

- **Electron**: デスクトップアプリケーションフレームワーク
- **React**: UIフレームワーク
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **Monaco Editor**: コードエディタ
- **Zustand**: 状態管理

## キーボードショートカット

- `⌘N`: 新規セッション（タブ）
- `⌘V`: 左右にペースト
- `⌘⌥V`: クリップボード履歴から挿入
- `⌘1`: Unifiedモード
- `⌘2`: Side-by-sideモード
- `F7`/`Shift+F7`: 次/前のhunkへジャンプ
- `⌘⇧S`: Unified Diffでエクスポート
- `⌘K`: クリア
- `⌘⇧K`: 左右スワップ

## ライセンス

MIT

## 開発状況

現在開発中です。詳細は [spec.md](./spec.md) を参照してください。
