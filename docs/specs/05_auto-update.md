# 自動更新仕様書

## 概要

SnipDiffは**electron-updater**を使用した自動更新機能を実装しています。GitHub Releasesをベースに、新しいバージョンのチェック、ダウンロード、インストールを自動化します。

## 更新の仕組み

### 更新フロー全体

```
起動時チェック（設定で有効な場合）
       ↓
  更新チェック実行
       ↓
   ┌───────┴────────┐
   │                │
更新なし         更新あり
   │                │
   └──→ 終了    通知バナー表示
                    ↓
              ユーザーが選択
                    ↓
            ┌───────┴────────┐
            │                │
          閉じる          ダウンロード
            │                │
            └──→ 終了    ダウンロード進行
                              ↓
                        ダウンロード完了
                              ↓
                        インストール確認
                              ↓
                    ┌─────────┴─────────┐
                    │                   │
                  後で              今すぐ
                    │                   │
                    └──→ 終了    アプリ再起動
                                        ↓
                                  更新適用
```

## 更新チェックのトリガー

### 1. 起動時チェック（オプション）

**条件**:
- 設定で `autoUpdate` が `true` の場合のみ
- 開発環境（`isDev`）では実行されない

**タイミング**:
- アプリ起動後、3秒遅延してチェック実行

**実装**:
```typescript
// main.ts
if (!isDev && settings.get('autoUpdate') === true) {
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);
}
```

**目的**:
- 起動時のパフォーマンスへの影響を最小化
- UI表示後にバックグラウンドで確認

---

### 2. 定期チェック

**間隔**: 12時間（`UPDATE_CHECK_INTERVAL = 12 * 60 * 60 * 1000`）

**条件**:
- 設定で `autoUpdate` が `true` の場合のみ
- 開発環境では実行されない

**動作**:
- 設定が有効になると定期チェックを開始
- 設定が無効になると定期チェックを停止
- アプリ終了時に自動的にクリーンアップ

**実装**:
```typescript
let updateCheckInterval: NodeJS.Timeout | null = null;

function startPeriodicUpdateCheck() {
  if (updateCheckInterval) return;
  updateCheckInterval = setInterval(() => {
    autoUpdater.checkForUpdates();
  }, UPDATE_CHECK_INTERVAL);
}

function stopPeriodicUpdateCheck() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }
}

// 設定変更を監視
settings.onDidChange('autoUpdate', (newValue) => {
  if (newValue === true) {
    startPeriodicUpdateCheck();
  } else {
    stopPeriodicUpdateCheck();
  }
});

// アプリ終了時にクリーンアップ
app.on('will-quit', () => {
  stopPeriodicUpdateCheck();
});
```

---

### 3. 手動チェック

#### 3.1 メニューから
- **メニュー項目**: "SnipDiff" > "Check for Updates..."
- **動作**: `autoUpdater.checkForUpdatesAndNotify()` 呼び出し
- **特徴**: 更新がない場合もダイアログで通知

#### 3.2 設定画面から
- **ボタン**: "今すぐ更新を確認"
- **動作**: `autoUpdater.checkForUpdates()` 呼び出し
- **フィードバック**:
  - チェック中: "確認中..."
  - 更新あり: UpdateNotificationバナー表示
  - 更新なし: "最新バージョンです" メッセージ（3秒後に消える）
  - エラー: "更新チェックに失敗しました" メッセージ（3秒後に消える）

---

## 更新イベントと通知

### 1. update:available（更新が利用可能）

**発生タイミング**: 新しいバージョンが見つかったとき

**送信データ**:
```typescript
{
  version: string;        // 例: "2025.10.1"
  releaseDate: string;    // 例: "2025-10-26"
  releaseNotes?: string;  // リリースノート（オプション）
}
```

**UI動作**:
- UpdateNotificationバナーを表示
- ストアの `isUpdateAvailable` を `true` に設定

---

### 2. update:not-available（更新なし）

**発生タイミング**: 最新バージョンを使用している場合

**UI動作**:
- 手動チェックの場合のみメッセージ表示
- 自動チェックの場合は何も表示しない

---

### 3. update:download-progress（ダウンロード進捗）

**発生タイミング**: ダウンロード中、定期的に送信

**送信データ**:
```typescript
{
  percent: number;        // 0-100の進捗率
  bytesPerSecond: number; // ダウンロード速度
  transferred: number;    // 転送済みバイト数
  total: number;         // 総バイト数
}
```

**UI動作**:
- UpdateNotificationのプログレスバーを更新
- パーセンテージ表示を更新

---

### 4. update:downloaded（ダウンロード完了）

**発生タイミング**: ダウンロードが完了したとき

**送信データ**:
```typescript
{
  version: string;
  releaseDate: string;
  releaseNotes?: string;
  downloadedPath?: string;
}
```

**UI動作**:
- "ダウンロードが完了しました" メッセージ表示
- "インストール" と "後で" ボタンを表示

---

### 5. update:error（エラー）

**発生タイミング**: 更新処理中にエラーが発生したとき

**送信データ**:
```typescript
{
  message: string;  // エラーメッセージ
}
```

**UI動作**:
- コンソールにエラーログ出力
- 手動チェックの場合はエラーメッセージ表示

---

## UpdateNotification UI

### 状態と表示

#### 1. 更新利用可能（初期状態）

```
┌─────────────────────────────────────────────────┐
│ 新しいバージョンが利用可能です             [×]   │
│ バージョン 2025.10.1 がリリースされました        │
│                                                 │
│ [ダウンロード]                                  │
└─────────────────────────────────────────────────┘
```

**ボタン**:
- **ダウンロード**: クリックでダウンロード開始
- **閉じる（×）**: バナーを閉じる

---

#### 2. ダウンロード中

```
┌─────────────────────────────────────────────────┐
│ ダウンロード中...                          [×]   │
│                                                 │
│ ████████████████░░░░░░░░░░░░ 65%               │
│                                                 │
│ [キャンセル]                                    │
└─────────────────────────────────────────────────┘
```

**UI要素**:
- プログレスバー: ダウンロード進捗を視覚化
- パーセンテージ: 数値で進捗表示

**ボタン**:
- **キャンセル**: ダウンロードを中止してバナーを閉じる
- **閉じる（×）**: バックグラウンドでダウンロード継続、バナーのみ閉じる

---

#### 3. ダウンロード完了

```
┌─────────────────────────────────────────────────┐
│ ダウンロードが完了しました                 [×]   │
│                                                 │
│ [今すぐインストール]  [後で]                    │
└─────────────────────────────────────────────────┘
```

**ボタン**:
- **今すぐインストール**: アプリを再起動して更新を適用
- **後で**: バナーを閉じる（次回起動時に更新が適用される）
- **閉じる（×）**: バナーを閉じる

---

### テーマ対応

UpdateNotificationはライト/ダークテーマに対応:

```css
/* ライトテーマ */
.update-notification.light {
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  color: #24292f;
}

/* ダークテーマ */
.update-notification.dark {
  background: #161b22;
  border: 1px solid #30363d;
  color: #c9d1d9;
}
```

---

## IPC通信

### updater.checkForUpdates()

**チャンネル**: `update:check`
**戻り値**: `Promise<void>`

更新チェックを実行

---

### updater.downloadUpdate()

**チャンネル**: `update:download`
**戻り値**: `Promise<void>`

更新をダウンロード

---

### updater.installUpdate()

**チャンネル**: `update:install`
**戻り値**: `Promise<void>`

更新をインストール（アプリを再起動）

---

### updater.onUpdateAvailable(callback)

**チャンネル**: `update:available`
**引数**: `(info: UpdateInfo) => void`

更新が利用可能なときのイベント

---

### updater.onUpdateNotAvailable(callback)

**チャンネル**: `update:not-available`
**引数**: `() => void`

更新がないときのイベント

---

### updater.onDownloadProgress(callback)

**チャンネル**: `update:download-progress`
**引数**: `(progress: DownloadProgress) => void`

ダウンロード進捗のイベント

---

### updater.onUpdateDownloaded(callback)

**チャンネル**: `update:downloaded`
**引数**: `(info: UpdateInfo) => void`

ダウンロード完了のイベント

---

### updater.onError(callback)

**チャンネル**: `update:error`
**引数**: `(error: { message: string }) => void`

エラー発生時のイベント

---

## 設定との連携

### autoUpdate設定の変更検知

```typescript
// main.ts
settings.onDidChange('autoUpdate', (newValue) => {
  if (newValue === true) {
    // 定期チェック開始
    startPeriodicUpdateCheck();

    // 即座に1回チェック
    if (!isDev) {
      autoUpdater.checkForUpdates();
    }
  } else {
    // 定期チェック停止
    stopPeriodicUpdateCheck();
  }
});
```

**動作**:
1. 設定モーダルで `autoUpdate` を有効化
2. 保存ボタンをクリック
3. メインプロセスで変更を検知
4. 即座に更新チェックを実行
5. 定期チェックを開始

---

## セキュリティ

### コード署名の検証

electron-updaterは、ダウンロードしたアップデートのコード署名を自動的に検証します。

**要件**:
- 配布される `.dmg` にはApple Developer IDで署名が必要
- 署名がない、または無効な場合はインストールを拒否

**検証項目**:
1. 署名の有効性
2. 証明書の信頼性
3. アプリバンドルIDの一致

---

### HTTPS通信

GitHub Releasesからのダウンロードは常にHTTPSで行われます。

---

## エラーハンドリング

### ネットワークエラー

**原因**: インターネット接続なし、またはGitHubにアクセスできない

**動作**:
- `update:error` イベントを発行
- コンソールにエラーログ出力
- 手動チェックの場合はUIにエラーメッセージ表示

**対処**:
- ネットワーク接続を確認
- 再度手動チェックを実行

---

### ダウンロード失敗

**原因**: ダウンロード中の接続切断、ディスク容量不足

**動作**:
- `update:error` イベントを発行
- ダウンロードをキャンセル

**対処**:
- ディスク容量を確認
- 再度ダウンロードを試行

---

### インストール失敗

**原因**: アプリが他のプロセスによってロックされている

**動作**:
- インストールをスキップ
- 次回起動時に再試行

**対処**:
- アプリを完全に終了
- 手動で再起動

---

## テスト

### ユニットテスト

**ファイル**: `app/main/autoUpdater.test.ts`

**カバー範囲**:
- 起動時チェックのロジック
- 定期チェックの開始/停止
- 設定変更時の動作

---

### E2Eテスト

**ファイル**: `tests/e2e/app/auto-update.spec.ts`

**カバー範囲**:
- 設定画面での自動更新設定の変更
- 手動更新チェックの実行
- UpdateNotificationの表示/非表示

**注**: 実際の更新ダウンロード・インストールはE2Eテストでは検証せず、手動テストで確認

---

## トラブルシューティング

### 更新チェックが実行されない

**原因**: `autoUpdate` が無効、または開発環境で実行している

**対処**:
1. 設定モーダルで `autoUpdate` を有効化
2. 本番ビルド（`.dmg`）で動作確認
3. コンソールログで `autoUpdater` のイベントを確認

---

### 更新通知が表示されない

**原因**: GitHub Releasesに新しいバージョンが存在しない

**対処**:
1. GitHubのReleasesページで最新バージョンを確認
2. `package.json` のバージョンと比較
3. 新しいバージョンをリリース

---

### ダウンロードが進まない

**原因**: ファイアウォールがダウンロードをブロックしている

**対処**:
1. ファイアウォール設定を確認
2. ブラウザで直接 `.dmg` をダウンロード
3. 手動でインストール

---

### インストール後も古いバージョンのまま

**原因**: アプリが完全に終了していない

**対処**:
1. アクティビティモニタで `SnipDiff` プロセスを確認
2. プロセスを強制終了
3. アプリを再起動

---

## 最終確認日時の保存

設定画面では、最後に更新をチェックした日時を表示します。

**保存場所**: `localStorage.lastUpdateCheck`

**フォーマット**: `YYYY/MM/DD HH:MM`

**例**: `2025/10/26 14:30`

**実装**:
```typescript
// SettingsModal.tsx
const handleCheckForUpdates = async () => {
  await window.electron.updater.checkForUpdates();

  const now = new Date();
  const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  setLastUpdateCheck(formattedDate);
  localStorage.setItem('lastUpdateCheck', formattedDate);
};
```

---

## 開発環境での動作

### 制限事項

開発環境（`npm run dev`）では、自動更新機能は**無効化**されています。

**理由**:
- electron-updaterは署名済みアプリでのみ動作
- 開発時のビルドには署名がない
- 誤って更新を実行しないため

**確認方法**:
```typescript
const isDev = !app.isPackaged;
if (!isDev) {
  autoUpdater.checkForUpdates();
}
```

### テスト方法

自動更新機能をテストするには、以下の手順を実施：

1. 本番ビルドを作成: `npm run dist:mac`
2. `.dmg` をインストール
3. アプリを起動して動作確認
