import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UpdateNotification from './UpdateNotification';

describe('UpdateNotification', () => {
  let mockUpdater: {
    onUpdateAvailable: ReturnType<typeof vi.fn>;
    onDownloadProgress: ReturnType<typeof vi.fn>;
    onUpdateDownloaded: ReturnType<typeof vi.fn>;
    onError: ReturnType<typeof vi.fn>;
    removeAllListeners: ReturnType<typeof vi.fn>;
    downloadUpdate: ReturnType<typeof vi.fn>;
    installUpdate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // モックアップデーター
    mockUpdater = {
      onUpdateAvailable: vi.fn(),
      onDownloadProgress: vi.fn(),
      onUpdateDownloaded: vi.fn(),
      onError: vi.fn(),
      removeAllListeners: vi.fn(),
      downloadUpdate: vi.fn().mockResolvedValue(undefined),
      installUpdate: vi.fn().mockResolvedValue(undefined),
    };

    // window.electron.updaterをモック
    Object.defineProperty(window, 'electron', {
      value: {
        updater: mockUpdater,
      },
      writable: true,
      configurable: true,
    });
  });

  describe('初期状態', () => {
    it('hidden状態では何も表示されない', () => {
      const { container } = render(<UpdateNotification theme="light" />);
      expect(container.firstChild).toBeNull();
    });

    it('electron APIが利用できない場合は何も表示されない', () => {
      Object.defineProperty(window, 'electron', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { container } = render(<UpdateNotification theme="light" />);
      expect(container.firstChild).toBeNull();
    });

    it('useEffect内でイベントリスナーを登録する', () => {
      render(<UpdateNotification theme="light" />);

      expect(mockUpdater.onUpdateAvailable).toHaveBeenCalled();
      expect(mockUpdater.onDownloadProgress).toHaveBeenCalled();
      expect(mockUpdater.onUpdateDownloaded).toHaveBeenCalled();
      expect(mockUpdater.onError).toHaveBeenCalled();
    });

    it('アンマウント時にリスナーをクリーンアップする', () => {
      const { unmount } = render(<UpdateNotification theme="light" />);
      unmount();

      expect(mockUpdater.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('更新が利用可能な状態 (available)', () => {
    it('更新利用可能メッセージとダウンロードボタンを表示する', async () => {
      render(<UpdateNotification theme="light" />);

      const availableCallback = mockUpdater.onUpdateAvailable.mock.calls[0][0];

      await act(async () => {
        availableCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByText('新しいバージョンが利用可能です')).toBeTruthy();
      });

      expect(screen.getByText('バージョン 1.0.0 が利用可能です')).toBeTruthy();
      expect(screen.getByRole('button', { name: /ダウンロード/ })).toBeTruthy();
    });

    it('ダウンロードボタンをクリックするとdownloadUpdate APIを呼び出す', async () => {
      const user = userEvent.setup({ delay: null });
      render(<UpdateNotification theme="light" />);

      const availableCallback = mockUpdater.onUpdateAvailable.mock.calls[0][0];

      await act(async () => {
        availableCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ダウンロード/ })).toBeTruthy();
      });

      const downloadButton = screen.getByRole('button', { name: /ダウンロード/ });
      await user.click(downloadButton);

      expect(mockUpdater.downloadUpdate).toHaveBeenCalledOnce();
    });

    it('downloadUpdateがエラーをスローしてもクラッシュしない', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup({ delay: null });

      mockUpdater.downloadUpdate.mockRejectedValueOnce(new Error('Network error'));

      render(<UpdateNotification theme="light" />);

      const availableCallback = mockUpdater.onUpdateAvailable.mock.calls[0][0];

      await act(async () => {
        availableCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ダウンロード/ })).toBeTruthy();
      });

      const downloadButton = screen.getByRole('button', { name: /ダウンロード/ });
      await user.click(downloadButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to start download:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('閉じるボタンをクリックすると非表示になる', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<UpdateNotification theme="light" />);

      const availableCallback = mockUpdater.onUpdateAvailable.mock.calls[0][0];

      await act(async () => {
        availableCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.queryByText('新しいバージョンが利用可能です')).toBeTruthy();
      });

      const closeButton = screen.getAllByRole('button')[1]; // 2番目のボタンが閉じるボタン
      await user.click(closeButton);

      expect(container.firstChild).toBeNull();
    });

  });

  describe('ダウンロード中の状態 (downloading)', () => {
    it('ダウンロード進捗のプログレスバーを表示する', async () => {
      render(<UpdateNotification theme="light" />);

      // まずavailable状態にする
      const availableCallback = mockUpdater.onUpdateAvailable.mock.calls[0][0];
      await act(async () => {
        availableCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      // ダウンロード進捗イベントを発火
      const progressCallback = mockUpdater.onDownloadProgress.mock.calls[0][0];
      await act(async () => {
        progressCallback({
          percent: 50,
          transferred: 50 * 1024 * 1024, // 50MB
          total: 100 * 1024 * 1024, // 100MB
        });
      });

      await waitFor(() => {
        expect(screen.getByText('更新をダウンロード中...')).toBeTruthy();
      });

      expect(screen.getByText(/50% \(50MB \/ 100MB\)/)).toBeTruthy();
    });


    it('downloading状態からさらにダウンロード進捗が更新される', async () => {
      render(<UpdateNotification theme="light" />);

      const availableCallback = mockUpdater.onUpdateAvailable.mock.calls[0][0];
      await act(async () => {
        availableCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      const progressCallback = mockUpdater.onDownloadProgress.mock.calls[0][0];

      // 最初の進捗
      await act(async () => {
        progressCallback({
          percent: 30,
          transferred: 30 * 1024 * 1024,
          total: 100 * 1024 * 1024,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/30% \(30MB \/ 100MB\)/)).toBeTruthy();
      });

      // 2回目の進捗
      await act(async () => {
        progressCallback({
          percent: 80,
          transferred: 80 * 1024 * 1024,
          total: 100 * 1024 * 1024,
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/80% \(80MB \/ 100MB\)/)).toBeTruthy();
      });
    });

    it('available以外の状態でdownloadProgressが来ても無視される', async () => {
      const { container } = render(<UpdateNotification theme="light" />);

      // hidden状態でprogressイベントを発火
      const progressCallback = mockUpdater.onDownloadProgress.mock.calls[0][0];
      await act(async () => {
        progressCallback({
          percent: 50,
          transferred: 50 * 1024 * 1024,
          total: 100 * 1024 * 1024,
        });
      });

      // 何も表示されないはず
      expect(container.firstChild).toBeNull();
    });
  });

  describe('更新準備完了の状態 (ready)', () => {
    it('インストールボタンを表示する', async () => {
      render(<UpdateNotification theme="light" />);

      const downloadedCallback = mockUpdater.onUpdateDownloaded.mock.calls[0][0];
      await act(async () => {
        downloadedCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByText('更新の準備ができました')).toBeTruthy();
      });

      expect(screen.getByText('バージョン 1.0.0 をインストールして再起動します')).toBeTruthy();
      expect(screen.getByRole('button', { name: '再起動してインストール' })).toBeTruthy();
      expect(screen.getByRole('button', { name: '後で' })).toBeTruthy();
    });

    it('インストールボタンをクリックするとinstallUpdate APIを呼び出す', async () => {
      const user = userEvent.setup({ delay: null });
      render(<UpdateNotification theme="light" />);

      const downloadedCallback = mockUpdater.onUpdateDownloaded.mock.calls[0][0];
      await act(async () => {
        downloadedCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '再起動してインストール' })).toBeTruthy();
      });

      const installButton = screen.getByRole('button', { name: '再起動してインストール' });
      await user.click(installButton);

      expect(mockUpdater.installUpdate).toHaveBeenCalledOnce();
    });

    it('installUpdateがエラーをスローしてもクラッシュしない', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const user = userEvent.setup({ delay: null });

      mockUpdater.installUpdate.mockRejectedValueOnce(new Error('Installation failed'));

      render(<UpdateNotification theme="light" />);

      const downloadedCallback = mockUpdater.onUpdateDownloaded.mock.calls[0][0];
      await act(async () => {
        downloadedCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '再起動してインストール' })).toBeTruthy();
      });

      const installButton = screen.getByRole('button', { name: '再起動してインストール' });
      await user.click(installButton);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to install update:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('「後で」ボタンをクリックすると非表示になる', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<UpdateNotification theme="light" />);

      const downloadedCallback = mockUpdater.onUpdateDownloaded.mock.calls[0][0];
      await act(async () => {
        downloadedCallback({ version: '1.0.0', releaseDate: '2024-01-01' });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '後で' })).toBeTruthy();
      });

      const laterButton = screen.getByRole('button', { name: '後で' });
      await user.click(laterButton);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('エラー状態 (error)', () => {
    it('エラーメッセージを表示する', async () => {
      render(<UpdateNotification theme="light" />);

      const errorCallback = mockUpdater.onError.mock.calls[0][0];
      await act(async () => {
        errorCallback({ message: 'Network error occurred' });
      });

      await waitFor(() => {
        expect(screen.getByText('更新エラー')).toBeTruthy();
      });

      expect(screen.getByText('Network error occurred')).toBeTruthy();
    });


  });
});
