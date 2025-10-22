import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app, BrowserWindow, clipboard, dialog, ipcMain, nativeTheme } from 'electron';
import { autoUpdater } from 'electron-updater';
import {
  type AppSettings,
  type DownloadProgress,
  IPC_CHANNELS,
  type UpdateInfo,
} from '../shared/types';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development';

// electron-storeはESモジュールなので動的importで読み込む
// biome-ignore lint/suspicious/noExplicitAny: 動的importのため型定義不可
let ElectronStore: any;
// biome-ignore lint/suspicious/noExplicitAny: 動的importのため型定義不可
let store: any;

// アプリケーション名を早期に設定（メニューバー表示用）
app.setName('SnipDiff');

// クリップボード履歴（メモリ内のみ）
const clipboardHistory: Array<{ id: string; content: string; timestamp: number }> = [];
const MAX_HISTORY_SIZE = 50;

// 設定ストアの初期化（非同期）
async function initializeStore() {
  // TypeScriptのimport()はCommonJSでrequire()に変換されてしまうため、
  // Function constructorを使って真の動的importを実現
  const importDynamic = new Function('specifier', 'return import(specifier)');
  const StoreModule = await importDynamic('electron-store');
  ElectronStore = StoreModule.default;

  store = new ElectronStore({
    defaults: {
      theme: 'auto',
      defaultOptions: {
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
      },
      defaultLanguage: 'plaintext',
      defaultEOL: 'auto',
      shortcuts: {},
      clipboardHistorySize: 50,
      clipboardHistoryTTL: 1000 * 60 * 60 * 24, // 24時間
      autoUpdate: false,
      crashReport: false,
      devMode: false, // 開発者モード（設定ファイルで有効化可能）
    },
  });
}

/**
 * メインウィンドウを作成
 */
function createWindow(): void {
  // preloadスクリプトのパスを設定
  const preloadPath = isDev
    ? path.join(__dirname, '../../../preload/app/preload/preload.js')
    : path.join(app.getAppPath(), 'dist/preload/app/preload/preload.js');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'SnipDiff',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
  });

  // 開発モードとプロダクションモードで読み込み先を変更
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 本番モード: asarパッケージ内のindex.htmlを読み込む
    const rendererPath = path.join(app.getAppPath(), 'dist/renderer/index.html');
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // ウィンドウの最大化状態の変更を監視
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGED, {
      isMaximized: true,
    });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZED_CHANGED, {
      isMaximized: false,
    });
  });
}

/**
 * アプリケーション起動時の処理
 */
app.whenReady().then(async () => {
  // electron-storeを初期化
  await initializeStore();

  // Aboutパネルの情報をカスタマイズ（macOS）
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'SnipDiff',
      applicationVersion: '2025.10.8',
      version: 'v2025.10.8',
      copyright: '© 2025',
      credits: 'GitHub-like diff viewer for unsaved text',
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // IPCハンドラの登録
  registerIpcHandlers();

  // 自動更新の設定
  setupAutoUpdater();

  // 設定で自動更新が有効な場合、起動時に更新チェック
  const settings = store.store as AppSettings;
  if (settings.autoUpdate && !isDev) {
    // ウィンドウが表示されてから少し待ってチェック
    setTimeout(() => {
      checkForUpdates();
    }, 3000);
  }
});

/**
 * ウィンドウが全て閉じられた時の処理
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 自動更新の設定とイベントリスナーの登録
 */
function setupAutoUpdater(): void {
  // 開発環境では自動更新を無効化
  if (isDev) {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    return;
  }

  // 自動更新の設定
  autoUpdater.autoDownload = false; // 手動でダウンロードを制御
  autoUpdater.autoInstallOnAppQuit = true; // アプリ終了時に自動インストール

  // 更新が利用可能になったとき
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    const updateInfo: UpdateInfo = {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    };
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, updateInfo);
  });

  // 更新が利用不可の場合
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info.version);
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_NOT_AVAILABLE, {
      version: info.version,
    });
  });

  // ダウンロード進捗
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
    );
    const progress: DownloadProgress = {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    };
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOAD_PROGRESS, progress);
  });

  // ダウンロード完了
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    const updateInfo: UpdateInfo = {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
    };
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED, updateInfo);
  });

  // エラー発生時
  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    mainWindow?.webContents.send(IPC_CHANNELS.UPDATE_ERROR, {
      message: error.message,
    });
  });
}

/**
 * 更新チェックを実行
 */
async function checkForUpdates(): Promise<void> {
  if (isDev) {
    console.log('Auto-update is disabled in development mode');
    return;
  }

  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

/**
 * IPCハンドラを登録
 */
function registerIpcHandlers(): void {
  // クリップボード読み取り
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_READ, async () => {
    try {
      return clipboard.readText();
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      throw error;
    }
  });

  // クリップボード書き込み
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, async (_event, text: string) => {
    try {
      clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to write clipboard:', error);
      throw error;
    }
  });

  // クリップボード履歴取得
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_HISTORY_GET, async () => {
    return clipboardHistory;
  });

  // クリップボード履歴追加
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_HISTORY_ADD, async (_event, content: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const item = {
      id,
      content,
      timestamp: Date.now(),
    };

    clipboardHistory.unshift(item);

    // 上限を超えたら古いものを削除
    if (clipboardHistory.length > MAX_HISTORY_SIZE) {
      clipboardHistory.pop();
    }

    return item;
  });

  // ファイル保存
  ipcMain.handle(IPC_CHANNELS.FILE_SAVE, async (_event, content: string, defaultName?: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Save Diff',
        defaultPath: defaultName || 'diff.patch',
        filters: [
          { name: 'Patch Files', extensions: ['patch', 'diff'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.writeFile(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Failed to save file:', error);
      return { success: false, error: String(error) };
    }
  });

  // ファイルを開く
  ipcMain.handle(IPC_CHANNELS.FILE_OPEN, async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Open Text File',
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt', 'patch', 'diff'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const content = await fs.readFile(result.filePaths[0], 'utf-8');
      return { success: true, content, filePath: result.filePaths[0] };
    } catch (error) {
      console.error('Failed to open file:', error);
      return { success: false, error: String(error) };
    }
  });

  // 設定の取得
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    return store.store as AppSettings;
  });

  // 設定の保存
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, settings: Partial<AppSettings>) => {
    try {
      const currentStore = store.store as AppSettings;
      const updatedStore = { ...currentStore, ...settings };

      // defaultOptionsの部分的な更新をサポート
      if (settings.defaultOptions) {
        updatedStore.defaultOptions = {
          ...currentStore.defaultOptions,
          ...settings.defaultOptions,
        };
      }

      store.store = updatedStore;

      return { success: true };
    } catch (error) {
      console.error('Failed to save settings:', error);
      return { success: false, error: String(error) };
    }
  });

  // テーマ取得
  ipcMain.handle(IPC_CHANNELS.THEME_GET, async () => {
    return {
      shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
      system: nativeTheme.themeSource,
    };
  });

  // ウィンドウコントロール
  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, async () => {
    mainWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, async () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, async () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, async () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // 自動更新関連
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    await checkForUpdates();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
    if (!isDev) {
      try {
        await autoUpdater.downloadUpdate();
      } catch (error) {
        console.error('Failed to download update:', error);
        throw error;
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, async () => {
    if (!isDev) {
      // ダウンロード済みの更新をインストールして再起動
      autoUpdater.quitAndInstall(false, true);
    }
  });
}

// テーマ変更の監視
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send(IPC_CHANNELS.THEME_CHANGED, {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  });
});
