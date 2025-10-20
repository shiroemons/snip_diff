import React, { useEffect, useRef } from 'react';
import { useDiffStore } from './stores/diffStore';
import Header from './components/Header';
import DiffEditor, { type DiffEditorRef } from './features/diff/DiffEditor';
import Footer from './components/Footer';

const App: React.FC = () => {
  const { initializeSession, theme, updateOptions } = useDiffStore();
  const diffEditorRef = useRef<DiffEditorRef>(null);
  const [actualTheme, setActualTheme] = React.useState<'light' | 'dark'>('dark');

  // 初回セッションの作成（一度だけ実行）
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // テーマの初期化と監視（themeが変更された時のみ実行）
  useEffect(() => {
    // Electron APIが利用可能かチェック
    if (!window.electron) {
      console.warn('Electron API is not available. Running in browser mode.');
      return;
    }

    // テーマの初期化
    const initTheme = async () => {
      try {
        const themeInfo = await window.electron.theme.get();
        console.log('Initial theme:', themeInfo);
        // Autoモードの場合はシステムテーマを適用
        if (theme === 'auto') {
          setActualTheme(themeInfo.shouldUseDarkColors ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Failed to get initial theme:', error);
      }
    };

    initTheme();

    // テーマ変更のリスナー
    window.electron.theme.onChanged((themeInfo) => {
      console.log('Theme changed:', themeInfo);
      // Autoモードの場合のみシステムテーマを適用
      if (theme === 'auto') {
        setActualTheme(themeInfo.shouldUseDarkColors ? 'dark' : 'light');
      }
    });

    return () => {
      window.electron.theme.removeListener();
    };
  }, [theme]);

  // テーマの適用
  useEffect(() => {
    if (theme === 'auto') {
      // actualThemeを使用（システム設定に従う）
    } else {
      // 明示的に選択されたテーマを使用
      setActualTheme(theme);
    }
  }, [theme]);

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

      // ⌘3: Compact モードのトグル
      if (e.key === '3') {
        e.preventDefault();
        const currentCompactMode = useDiffStore.getState().getActiveSession()?.options.compactMode ?? false;
        updateOptions({ compactMode: !currentCompactMode });
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateOptions]);

  return (
    <div className={`app ${actualTheme}`}>
      <Header
        onCompare={handleCompare}
        onSwap={handleSwap}
        onClear={handleClear}
      />
      <main className="main-content">
        <DiffEditor ref={diffEditorRef} theme={actualTheme} />
      </main>
      <Footer />
    </div>
  );
};

export default App;
