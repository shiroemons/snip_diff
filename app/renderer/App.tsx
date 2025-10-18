import React, { useEffect, useRef } from 'react';
import { useDiffStore } from './stores/diffStore';
import Header from './components/Header';
import DiffEditor, { DiffEditorRef } from './features/diff/DiffEditor';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { initializeSession, theme } = useDiffStore();
  const diffEditorRef = useRef<DiffEditorRef>(null);

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

  const handleCompare = () => {
    diffEditorRef.current?.compare();
  };

  return (
    <div className={`app ${theme}`}>
      <Header onCompare={handleCompare} />
      <main className="main-content">
        <DiffEditor ref={diffEditorRef} />
      </main>
      <Footer />
    </div>
  );
};

export default App;
