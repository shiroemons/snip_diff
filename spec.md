# SnipDiff — Electron版・未保存テキスト差分ビューア 仕様書 v0.1

> 目的：**保存していないテキスト同士の差分**を、GitHubのdiffに近いUIで高速・安全・オフラインに確認できるmacOSデスクトップアプリを提供する。

---

## 1. 背景 / 目的

* 一時テキスト（クリップボード、コピペ、生成AIの出力、ブラウザ上のドラフト等）同士の差分をすぐに比較したい。
* ファイル保存を前提にしないツールが少ない。ブラウザサービスは機密/オフライン面で不安がある。
* GitHubに慣れたエンジニアが直感的に使えるUIを求める。

**KPI（初期）**

* 起動→差分表示まで 1 秒未満（M3 Pro相当）
* 2×20,000行のテキストでの差分計算 < 1.5 秒（初回） / 再計算 < 800 ms
* メモリ上限の目安：400 MB（2×20k行時）

---

## 2. スコープ

### In

* 未保存テキストの差分（左：Before / 右：After）。
* GitHubライクな**Unified**/**Side-by-side**の2モード。
* 行/語/文字レベルのハイライト、行番号、hunk（差分塊）ナビゲーション。
* クリップボード貼り付け、ドラッグ&ドロップ、手入力。
* オプション：空白無視、改行コード差異の無視、ケース無視。
* 結果の**コピー/エクスポート（Unified Diff patch）**。
* macOS（Apple Silicon/Intel）向け配布、**オフライン**動作。

### Out（初期リリース）

* ファイル/フォルダの再帰的差分。
* 3-way マージ、衝突解決。
* Git連携、クラウド同期。

---

## 3. ユースケース

1. クリップボードにある2つのスニペットの差分を即確認。
2. フォームの送信前/後のテキストを比較。
3. 生成AIの修正提案を原文と比較して採用可否を判断。

---

## 4. 画面 / UX 仕様（GitHubライク）

### 4.1 画面構成（メインウィンドウ）

* **ヘッダー**：モード切替（Unified/Side-by-side）／オプション（空白無視 等）／Theme（Light/Dark）／コピー/エクスポート／設定。
* **エディタ領域**：

  * 左（Before）・右（After）の**Monaco Diff Editor**を使用。
  * 入力はそのまま**即時差分**（debounce 120ms）。
* **フッター**：差分統計（+行数/−行数、hunk数、テキスト長）、言語推定表示、改行コード表示（LF/CRLF）。

### 4.2 表示モード

* **Side-by-side**：左右に原文/変更後を並列表示。差分行を連動スクロール。
* **Unified**：1カラムに +（追加）/ −（削除）で表示。hunkヘッダ、行番号、`@@ -a,b +c,d @@`風のラベル。

### 4.3 スタイル（GitHubライク）

* 追加行：淡い緑背景、削除行：淡い赤背景、編集内差分は濃色帯で強調。
* gutterに `+` / `-`、行番号、hunk境界線。
* フォント：等幅（例：SF Mono / Menlo優先）。

### 4.4 操作 & ショートカット（macOS基準）

* `⌘N` 新規セッション（タブ）。
* `⌘V` 左右にペースト（空の方に自動貼付）。
* `⌘⌥V` クリップボード履歴から挿入（アプリ内履歴。会期中のみ、アプリ終了で揮発）。
* `⌘1` Unified、`⌘2` Side-by-side 切替。
* `F7`/`Shift+F7` 次/前のhunkへジャンプ。
* `⌘⇧S` 結果をUnified Diff（.patch）でエクスポート。
* `⌘K` クリア、`⌘⇧K` 左右スワップ。

### 4.5 入出力

* **入力**：ペースト、ドラッグ&ドロップ（txt/patch/任意テキスト）、直接入力。
* **出力**：

  * Unified Diff（patch）を**クリップボードコピー**／**ファイル保存**。
  * 差分統計のコピー（`+12 −7, 3 hunks` など）。

### 4.6 オプション

* 末尾空白を無視 / 可視化切替。
* 改行コード差異を無視（LF と CRLF を同一視）。
* 大文字小文字を無視。
* タブ幅、折り返し、フォントサイズ。

### 4.7 アクセシビリティ

* フォーカスインジケータ、スクリーンリーダラベル、コントラスト基準。
* キーだけで全操作可能（ショートカットとフォーカス順）。

---

## 5. 機能要件

* **Diffエンジン**：

  * 表示は **Monaco Diff Editor** のレンダリングを採用（高速・安定）。
  * エクスポート（patch生成）は **jsdiff** 相当の実装で Unified Diff 文字列を生成。
  * 計算はWeb Workerでオフロード、UIブロック防止。
* **言語推定**：Monacoの言語推定を利用。手動切替も可能。
* **セッション**：複数タブ。アプリ終了時に破棄（**デフォルトは永続化しない**）。
* **履歴**：貼り付け履歴はプロセス内のみ保持（件数上限・時間上限あり）。

---

## 6. 非機能要件

* **パフォーマンス**：冒頭KPIを満たす。バックグラウンド再計算はdebounce。巨大テキスト時は“粗い差分→精密化”の2段階。
* **セキュリティ/プライバシー**：

  * デフォルトで**ネットワークアクセス禁止**（CSP）。
  * クリップボード読み取りは**ユーザ操作時のみ**。
  * 自動アップデート/診断送信は**オプトイン**。
* **配布**：

  * macOS `.dmg` / `.zip`。Universalまたはarm64ビルド。
  * 公証（notarization）・Gatekeeper通過。

---

## 7. アーキテクチャ

* **スタック**：Electron + React + TypeScript + Vite（renderer）。
* **UI**：Monaco Editor（DiffEditor）。
* **状態管理**：Zustand（軽量）。
* **メイン/レンダラ分離**：

  * PreloadでIPC（クリップボード、ファイル保存、設定読み書き）。
  * `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`。
* **ディレクトリ構成（例）**：

```
/ app
  / main            # Electron Main
  / preload         # IPCブリッジ
  / renderer        # React + Vite
    / components
    / features/diff
    / stores
    / workers
    / styles
  / shared          # 型やユーティリティ
```

---

## 8. データモデル（概略）

```ts
// 差分対象
type Buffer = {
  id: string;
  content: string;
  lang?: string;          // 推定言語
  eol: 'LF' | 'CRLF';
};

// セッション（タブ）
type DiffSession = {
  id: string;
  left: Buffer;
  right: Buffer;
  options: {
    ignoreWhitespace: boolean;
    ignoreCase: boolean;
    normalizeEOL: boolean;
    viewMode: 'unified' | 'side-by-side';
    wordWrap: boolean;
    tabSize: number;
  };
  stats?: { adds: number; dels: number; hunks: number };
};
```

---

## 9. 主要フロー

1. 起動 → 新規セッション作成（空の左右ペイン）。
2. ユーザーが左右に貼り付け → 120ms後に差分計算（Worker）。
3. レンダラでDiffEditorへ反映、統計を更新。
4. モード/オプション変更で再計算。
5. エクスポート要求でUnified Diff文字列を生成→保存/コピー。

---

## 10. エラー/例外設計

* 入力が巨大：警告とともに“粗い差分モード”に自動切替。詳細化は任意。
* 文字エンコーディング不明：UTF-8前提、制御文字は可視化。
* クリップボードアクセス失敗：再試行案内（権限/直前操作不足）。

---

## 11. 設定（Preferences）

* テーマ（Light/Dark/OS追従）、フォント、タブ幅、折り返し、ショートカットの再割当。
* 既定オプション（空白無視 等）。
* （オプトイン）自動アップデート、クラッシュレポート。

---

## 12. 受け入れ基準（サンプル）

* [機能] 2×1,000行の貼り付けで 300ms 以内に差分が出る。
* [UX] `⌘2` でSide-by-sideに切替し、スクロールが左右同期する。
* [出力] `.patch` のUnified Diffが `git apply --check` に通る（大半のケース）。
* [安全] オンライン接続を遮断しても全機能が動作する。

---

## 13. テスト

* 単体：オプション別の差分結果、patch生成、統計算出。
* E2E：貼り付け→表示→出力までの流れ（Playwright/Electron）。
* ベンチ：行数×差分率を変えたパフォーマンス計測。

---

## 14. 配布/リリース

* Electron Builderで `.dmg` 生成、署名、公証。
* バージョニング：`YYYY.MM.minor` など日付主体案。

---

## 15. ライセンス/法務

* 内部利用前提（非公開） or OSS（MIT）を選択。
* アイコンはオリジナル（差分記号`Δ`や`±`モチーフ）。

---

## 16. 将来拡張（ロードマップ）

* 3-way マージ、hunk単位の採用/破棄、片側編集のコミット補助。
* ファイルツリー差分（ドラッグ投入時のみ）。
* URL/HTTPレスポンスの差分（開発者向け）。
* テキスト正規化フィルタ（JSON/SQL/HTMLの整形差分）。

---

## 17. アプリ名候補

* **SnipDiff（決定）**：snippet（短文/一時テキスト）× diff の直感的な合成。短く口頭伝達が容易。
* （参考・履歴）DraftDiff / TempDiff / QuickDiff / ClipDiff / BufferDiff / UntitledDiff / PastePatch / QuickDelta / FluxDiff / BlinkDelta

> 製品名は **SnipDiff**、アプリ内表示も「SnipDiff（未保存テキスト差分）」とする。

---

