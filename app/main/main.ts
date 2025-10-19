import { app, BrowserWindow, ipcMain, clipboard, dialog, nativeTheme } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { IPC_CHANNELS } from '../shared/types';

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === 'development';

// アプリケーション名を早期に設定（メニューバー表示用）
app.setName('SnipDiff');

// クリップボード履歴（メモリ内のみ）
const clipboardHistory: Array<{ id: string; content: string; timestamp: number }> = [];
const MAX_HISTORY_SIZE = 50;

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
app.whenReady().then(() => {
  // Aboutパネルの情報をカスタマイズ（macOS）
  if (process.platform === 'darwin') {
    app.setAboutPanelOptions({
      applicationName: 'SnipDiff',
      applicationVersion: '2025.10.3',
      version: 'v2025.10.3',
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
  ipcMain.handle(
    IPC_CHANNELS.CLIPBOARD_HISTORY_ADD,
    async (_event, content: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    }
  );

  // ファイル保存
  ipcMain.handle(
    IPC_CHANNELS.FILE_SAVE,
    async (_event, content: string, defaultName?: string) => {
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
    }
  );

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

  // 設定の取得（簡易版：今後はelectron-storeなどを使用）
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    // TODO: 永続化された設定を読み込む
    return {
      theme: 'auto',
      defaultOptions: {
        ignoreWhitespace: false,
        normalizeEOL: true,
        viewMode: 'side-by-side',
        wordWrap: false,
        tabSize: 4,
        fontSize: 14,
      },
    };
  });

  // 設定の保存
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_event, settings) => {
    // TODO: 設定を永続化
    console.log('Settings updated:', settings);
    return { success: true };
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
}

// テーマ変更の監視
nativeTheme.on('updated', () => {
  mainWindow?.webContents.send(IPC_CHANNELS.THEME_CHANGED, {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  });
});
