import type { DownloadProgress, UpdateInfo } from '@shared/types';
import { Download, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import './UpdateNotification.css';

interface UpdateNotificationProps {
  theme: 'light' | 'dark';
}

type NotificationState =
  | { type: 'hidden' }
  | { type: 'available'; info: UpdateInfo }
  | { type: 'downloading'; info: UpdateInfo; progress: DownloadProgress }
  | { type: 'ready'; info: UpdateInfo }
  | { type: 'error'; message: string };

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ theme }) => {
  const [state, setState] = useState<NotificationState>({ type: 'hidden' });

  useEffect(() => {
    if (!window.electron?.updater) return;

    // 更新が利用可能
    window.electron.updater.onUpdateAvailable((info) => {
      setState({ type: 'available', info });
    });

    // ダウンロード進捗
    window.electron.updater.onDownloadProgress((progress) => {
      setState((prev) => {
        if (prev.type === 'available' || prev.type === 'downloading') {
          return {
            type: 'downloading',
            info: prev.info,
            progress,
          };
        }
        return prev;
      });
    });

    // ダウンロード完了
    window.electron.updater.onUpdateDownloaded((info) => {
      setState({ type: 'ready', info });
    });

    // エラー発生
    window.electron.updater.onError((error) => {
      setState({ type: 'error', message: error.message });
      // 5秒後に自動的に非表示
      setTimeout(() => {
        setState({ type: 'hidden' });
      }, 5000);
    });

    return () => {
      window.electron?.updater.removeAllListeners();
    };
  }, []);

  const handleDownload = async () => {
    if (state.type === 'available') {
      try {
        await window.electron.updater.downloadUpdate();
      } catch (error) {
        console.error('Failed to start download:', error);
      }
    }
  };

  const handleInstall = async () => {
    if (state.type === 'ready') {
      try {
        await window.electron.updater.installUpdate();
      } catch (error) {
        console.error('Failed to install update:', error);
      }
    }
  };

  const handleDismiss = () => {
    setState({ type: 'hidden' });
  };

  if (state.type === 'hidden') {
    return null;
  }

  return (
    <div className={`update-notification ${theme}`}>
      <div className="update-notification-content">
        {state.type === 'available' && (
          <>
            <div className="update-notification-text">
              <strong>新しいバージョンが利用可能です</strong>
              <p>バージョン {state.info.version} が利用可能です</p>
            </div>
            <div className="update-notification-actions">
              <button type="button" className="btn-primary" onClick={handleDownload}>
                <Download size={16} />
                ダウンロード
              </button>
              <button type="button" className="btn-secondary" onClick={handleDismiss}>
                <X size={16} />
              </button>
            </div>
          </>
        )}

        {state.type === 'downloading' && (
          <div className="update-notification-text">
            <strong>更新をダウンロード中...</strong>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${state.progress.percent}%` }} />
            </div>
            <p className="progress-text">
              {Math.round(state.progress.percent)}% (
              {Math.round(state.progress.transferred / 1024 / 1024)}MB /{' '}
              {Math.round(state.progress.total / 1024 / 1024)}MB)
            </p>
          </div>
        )}

        {state.type === 'ready' && (
          <>
            <div className="update-notification-text">
              <strong>更新の準備ができました</strong>
              <p>バージョン {state.info.version} をインストールして再起動します</p>
            </div>
            <div className="update-notification-actions">
              <button type="button" className="btn-primary" onClick={handleInstall}>
                再起動してインストール
              </button>
              <button type="button" className="btn-secondary" onClick={handleDismiss}>
                後で
              </button>
            </div>
          </>
        )}

        {state.type === 'error' && (
          <>
            <div className="update-notification-text error">
              <strong>更新エラー</strong>
              <p>{state.message}</p>
            </div>
            <div className="update-notification-actions">
              <button type="button" className="btn-secondary" onClick={handleDismiss}>
                <X size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;
