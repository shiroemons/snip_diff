import React, { useEffect, useRef, useCallback } from 'react';
import { useDiffStore } from './stores/diffStore';
import Header from './components/Header';
import DiffEditor, { DiffEditorRef } from './features/diff/DiffEditor';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { initializeSession, theme, updateOptions } = useDiffStore();
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

  const handleSwap = () => {
    diffEditorRef.current?.swap();
  };

  const handleClear = () => {
    diffEditorRef.current?.clear();
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // macOSのCmd (metaKey) をチェック
      if (!e.metaKey) return;

      // ⌘K: クリア
      if (e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        diffEditorRef.current?.clear();
        return;
      }

      // ⌘⇧K: スワップ
      if (e.key === 'K' && e.shiftKey) {
        e.preventDefault();
        diffEditorRef.current?.swap();
        return;
      }

      // ⌘1: Unified モード
      if (e.key === '1') {
        e.preventDefault();
        updateOptions({ viewMode: 'unified' });
        return;
      }

      // ⌘2: Side-by-side モード
      if (e.key === '2') {
        e.preventDefault();
        updateOptions({ viewMode: 'side-by-side' });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateOptions]);

  return (
    <div className={`app ${theme}`}>
      <Header
        onCompare={handleCompare}
        onSwap={handleSwap}
        onClear={handleClear}
      />
      <main className="main-content">
        <DiffEditor ref={diffEditorRef} />
      </main>
      <Footer />
    </div>
  );
};

export default App;
