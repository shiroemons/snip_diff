import React, { useEffect } from 'react';
import { useDiffStore } from './stores/diffStore';
import Header from './components/Header';
import DiffEditor from './features/diff/DiffEditor';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { initializeSession, theme } = useDiffStore();

  useEffect(() => {
    // 初回セッションの作成
    initializeSession();

    // Electron APIが利用可能かチェック
    if (!window.electron) {
      console.warn('Electron API is not available. Running in browser mode.');
      return;
    }

    // テーマの初期化
    const initTheme = async () => {
      try {
        const themeInfo = await window.electron.theme.get();
        // テーマ情報を取得してストアに反映
        console.log('Initial theme:', themeInfo);
      } catch (error) {
        console.error('Failed to get initial theme:', error);
      }
    };

    initTheme();

    // テーマ変更のリスナー
    window.electron.theme.onChanged((themeInfo) => {
      console.log('Theme changed:', themeInfo);
      // TODO: テーマをストアに反映
    });

    return () => {
      window.electron.theme.removeListener();
    };
  }, [initializeSession]);

  return (
    <div className={`app ${theme}`}>
      <Header />
      <main className="main-content">
        <DiffEditor />
      </main>
      <Footer />
    </div>
  );
};

export default App;
