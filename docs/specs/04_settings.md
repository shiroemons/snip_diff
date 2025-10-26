# 設定仕様書

## 概要

SnipDiffの設定は**electron-store**を使用して永続化され、アプリケーション終了後も保持されます。設定は設定モーダルから変更でき、保存ボタンをクリックすることで永続化されます。

## 設定の保存場所

### ファイルパス
- **macOS**: `~/Library/Application Support/snip-diff/config.json`

### 初回起動時
- デフォルト値で自動的に初期化される
- 設定ファイルが存在しない場合は自動作成

## 設定項目

### 1. テーマ（theme）

**型**: `'light' | 'dark' | 'auto'`
**デフォルト**: `'auto'`

アプリケーション全体のテーマ設定

#### 選択肢
- **light**: ライトテーマ（明るい背景）
- **dark**: ダークテーマ（暗い背景）
- **auto**: システムテーマ（macOSの外観設定に自動追従）

#### 動作
- **light/dark**: 設定したテーマが常に適用される
- **auto**:
  - macOSのシステムテーマを自動検出
  - システムテーマ変更時にリアルタイムで追従
  - `nativeTheme.shouldUseDarkColors` で判定

#### 影響範囲
- アプリケーション全体のUI
- Monaco Editorのテーマ
- 差分ハイライトの色

---

### 2. デフォルト差分オプション（defaultOptions）

**型**: `DiffOptions`
**デフォルト**: 以下のオブジェクト

```typescript
{
  ignoreWhitespace: false,
  normalizeEOL: true,
  viewMode: 'side-by-side',
  compactMode: false,
  wordWrap: false,
  tabSize: 4,
  fontSize: 14,
  insertSpaces: true,
  diffAlgorithm: 'advanced',
  hideUnchangedRegions: false,
  renderWhitespace: 'none',
}
```

#### 2.1 ignoreWhitespace

**型**: `boolean`
**デフォルト**: `false`

行頭・行末の空白や連続する空白の違いを無視するかどうか

- `true`: 空白の違いを無視
- `false`: 空白も差分として検出

#### 2.2 normalizeEOL

**型**: `boolean`
**デフォルト**: `true`

改行コード（LF/CRLF）の違いを無視するかどうか

- `true`: LFとCRLFを同一視
- `false`: 改行コードも差分として検出

#### 2.3 viewMode

**型**: `'unified' | 'side-by-side'`
**デフォルト**: `'side-by-side'`

差分の表示方式

- **side-by-side**: 左右並列表示
- **unified**: 統合表示（GitHubスタイル）

#### 2.4 compactMode

**型**: `boolean`
**デフォルト**: `false`

Compactモードの有効/無効

- `true`: 文字単位の精密ハイライト、行背景なし
- `false`: 通常の行単位ハイライト

#### 2.5 wordWrap

**型**: `boolean`
**デフォルト**: `false`

テキストの折り返し表示

- `true`: 長い行を折り返して表示
- `false`: 水平スクロールで表示

#### 2.6 tabSize

**型**: `number`
**デフォルト**: `4`
**選択肢**: `2 | 4 | 8`

タブ文字の表示幅、またはインデント1つあたりのスペース数

#### 2.7 fontSize

**型**: `number`
**デフォルト**: `14`
**範囲**: `10`〜`36`（2刻み）

エディタのフォントサイズ（ピクセル単位）

#### 2.8 insertSpaces

**型**: `boolean`
**デフォルト**: `true`

Tabキーを押したときにスペースを挿入するかタブ文字を挿入するか

- `true`: スペースを挿入
- `false`: タブ文字を挿入

#### 2.9 diffAlgorithm

**型**: `'legacy' | 'advanced'`
**デフォルト**: `'advanced'`

差分計算アルゴリズム

- **advanced**: 高精度な差分計算
- **legacy**: レガシーアルゴリズム

**注**: 現在は常に `'advanced'` を推奨

#### 2.10 hideUnchangedRegions

**型**: `boolean`
**デフォルト**: `false`

変更されていない領域を自動的に折りたたむかどうか

- `true`: 変更されていない3行以上の領域を折りたたみ
- `false`: 全行を表示

**注**: Compactモードが有効な場合、この設定に関わらず自動的に折りたたまれる

#### 2.11 renderWhitespace

**型**: `'none' | 'boundary' | 'selection' | 'trailing' | 'all'`
**デフォルト**: `'none'`

空白文字（スペース・タブ）の可視化方法

#### 選択肢
- **none**: 空白文字を通常通り表示（記号で表示しない）
- **boundary**: 単語と単語の間のスペースのみを記号で表示
- **selection**: テキストを選択したときだけ空白文字を記号で表示
- **trailing**: 行末の余分なスペースやタブのみを記号で表示
- **all**: すべてのスペースとタブを記号で表示

#### 利用シーン
- **none**: 通常のテキストエディタと同じ表示。デフォルト設定
- **boundary**: 単語間のスペース数を確認したい場合
- **selection**: 選択範囲内の空白のみを確認したい場合
- **trailing**: コードの品質チェック（不要な行末空白の検出）
- **all**: インデントや空白の問題を確認したい場合

#### 設定場所
- **フッター**: 現在のセッションの表示設定を変更
- **設定モーダル**: 新規セッション作成時のデフォルト値を設定

---

### 3. デフォルト言語（defaultLanguage）

**型**: `string`
**デフォルト**: `'plaintext'`

シンタックスハイライトのデフォルト言語

#### サポート言語
- `plaintext` - Plain Text（デフォルト）
- `javascript` - JavaScript
- `typescript` - TypeScript
- `python` - Python
- `java` - Java
- `csharp` - C#
- `cpp` - C++
- `c` - C
- `go` - Go
- `rust` - Rust
- `php` - PHP
- `ruby` - Ruby
- `swift` - Swift
- `kotlin` - Kotlin
- `html` - HTML
- `css` - CSS
- `scss` - SCSS
- `json` - JSON
- `xml` - XML
- `yaml` - YAML
- `markdown` - Markdown
- `sql` - SQL
- `shell` - Shell

---

### 4. デフォルト改行コード（defaultEOL）

**型**: `'LF' | 'CRLF' | 'auto'`
**デフォルト**: `'auto'`

新規セッション作成時のデフォルト改行コード

#### 選択肢
- **LF**: Unix/Mac形式（`\n`）
- **CRLF**: Windows形式（`\r\n`）
- **auto**: OS依存（macOSでは通常LF）

#### 動作
- 新規セッション作成時に左右のエディタに適用
- フッターから個別に変更可能

---

### 5. 自動更新（autoUpdate）

**型**: `boolean`
**デフォルト**: `false`

アプリ起動時の自動更新チェック

#### 動作
- `true`:
  - アプリ起動3秒後に更新チェック実行
  - 12時間ごとに定期チェック実行
  - 更新が見つかった場合、通知バナー表示
- `false`:
  - 自動チェックは実行されない
  - メニューまたは設定画面から手動チェック可能

#### 詳細
- [自動更新仕様書](05_auto-update.md) を参照

---

### 6. 開発者モード（devMode）

**型**: `boolean`
**デフォルト**: `false`
**表示条件**: 開発環境（`import.meta.env.DEV`）のみ

開発者向けの追加機能を有効化

#### 動作
- `true`: フッターに "DEV" バッジ表示
- `false`: 通常モード

#### 注意
- 本番ビルドでは設定画面に表示されない
- 開発環境でのみ有効な設定

---

## 設定の読み込み・保存

### 起動時の読み込み

```typescript
// App.tsx
useEffect(() => {
  const loadInitialSettings = async () => {
    const settings = await window.electron.settings.get();
    loadSettings(settings);
    initializeSession(); // 設定を反映した新規セッション作成
  };
  loadInitialSettings();
}, []);
```

1. アプリ起動時に `settings.get()` でファイルから設定を読み込み
2. Zustand storeに設定をロード
3. 設定を反映した新規セッションを作成

### 設定の保存

```typescript
// SettingsModal.tsx
const handleSave = async () => {
  const settings = {
    theme: localTheme,
    defaultOptions: localOptions,
    defaultLanguage: localLanguage,
    defaultEOL: localEOL,
    autoUpdate: localAutoUpdate,
    devMode: localDevMode, // 開発環境のみ
  };

  await window.electron.settings.set(settings);
  useDiffStore.getState().loadSettings(settings);
  closeSettingsModal();
};
```

1. ローカル状態から設定オブジェクトを作成
2. `settings.set()` でファイルに保存
3. Zustand storeにも反映
4. 現在のセッションにも即座に反映

### デフォルトへのリセット

```typescript
// SettingsModal.tsx
const handleReset = () => {
  setLocalTheme(INITIAL_DEFAULT_THEME);
  setLocalOptions({ ...INITIAL_DEFAULT_OPTIONS });
  setLocalLanguage(INITIAL_DEFAULT_LANGUAGE);
  setLocalEOL(INITIAL_DEFAULT_EOL);
  setLocalAutoUpdate(false);
  setLocalDevMode(false);
};
```

- リセットボタンで全設定をデフォルト値に戻す
- 確認ダイアログで意図しないリセットを防止
- 保存ボタンを押すまで永続化されない

---

## IPC通信

### settings.get()

**チャンネル**: `settings:get`
**戻り値**: `Promise<AppSettings>`

現在の設定をファイルから読み込み

### settings.set(settings)

**チャンネル**: `settings:set`
**引数**: `AppSettings`
**戻り値**: `Promise<{ success: boolean; error?: string }>`

設定をファイルに保存

### settings.onOpen(callback)

**チャンネル**: `settings:open`
**イベント**: メニューから「設定」を選択したとき

設定モーダルを開くためのイベント

---

## 設定ファイルの構造

### config.json の例

```json
{
  "theme": "auto",
  "defaultOptions": {
    "ignoreWhitespace": false,
    "normalizeEOL": true,
    "viewMode": "side-by-side",
    "compactMode": false,
    "wordWrap": false,
    "tabSize": 4,
    "fontSize": 14,
    "insertSpaces": true,
    "diffAlgorithm": "advanced",
    "hideUnchangedRegions": false,
    "renderWhitespace": "none"
  },
  "defaultLanguage": "plaintext",
  "defaultEOL": "auto",
  "autoUpdate": false,
  "devMode": false
}
```

### バリデーション

electron-storeのスキーマバリデーションにより、不正な値が保存されることを防止

- 型チェック
- 範囲チェック（fontSize: 10-36など）
- Enum値チェック（theme: 'light' | 'dark' | 'auto'など）

---

## 設定の反映タイミング

### 即座に反映される設定
- **theme**: テーマ切り替え（App.tsx で監視）
- **viewMode**: 差分表示モード
- **compactMode**: Compactモードのオン/オフ
- **fontSize, tabSize, insertSpaces, wordWrap, renderWhitespace**: エディタオプション

### 次回セッションから反映される設定
- **defaultLanguage**: 新規セッション作成時の言語
- **defaultEOL**: 新規セッション作成時の改行コード
- **defaultOptions**: 新規セッション作成時の差分オプション

### アプリ再起動が必要な設定
- **autoUpdate**: 自動更新チェックの有効/無効
  - 設定保存後、次回起動時から有効になる

---

## トラブルシューティング

### 設定が保存されない

**原因**: ファイル書き込み権限がない、またはディスク容量不足

**対処**:
1. `~/Library/Application Support/snip-diff/` の権限を確認
2. ディスク容量を確認
3. アプリを再起動

### 設定がデフォルトに戻る

**原因**: 設定ファイルが破損している、または不正な値が保存されている

**対処**:
1. 設定モーダルで「デフォルトにリセット」を実行
2. 保存ボタンをクリック
3. それでも解決しない場合、`config.json` を手動削除してアプリを再起動

### テーマが反映されない

**原因**: システムテーマの変更イベントが受信されていない

**対処**:
1. テーマを手動で「ライト」または「ダーク」に変更
2. 再度「システムテーマ」に変更
3. アプリを再起動
