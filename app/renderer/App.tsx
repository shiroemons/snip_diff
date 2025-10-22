import type { AppSettings } from '@shared/types';
import React, { useEffect, useRef } from 'react';
import Footer from './components/Footer';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import UpdateNotification from './components/UpdateNotification';
import DiffEditor, { type DiffEditorRef } from './features/diff/DiffEditor';
import { useDiffStore } from './stores/diffStore';

const App: React.FC = () => {
  const { initializeSession, theme, updateOptions, loadSettings } = useDiffStore();
  const diffEditorRef = useRef<DiffEditorRef>(null);
  const [actualTheme, setActualTheme] = React.useState<'light' | 'dark'>('dark');
  const initialized = useRef(false);
  const settingsLoaded = useRef(false);

  // 設定の読み込みと初回セッションの作成（一度だけ実行）
  // biome-ignore lint/correctness/useExhaustiveDependencies: 初回のみ実行するため意図的に空配列
  useEffect(() => {
    // React.StrictModeによる2重実行を防ぐ
    if (initialized.current) return;
    initialized.current = true;

    const loadInitialSettings = async () => {
      try {
        if (window.electron) {
          const settings = (await window.electron.settings.get()) as AppSettings;
          loadSettings({
            theme: settings.theme,
            defaultOptions: settings.defaultOptions,
            defaultLanguage: settings.defaultLanguage,
            defaultEOL: settings.defaultEOL,
            devMode: settings.devMode,
          });

          // 設定読み込み後、即座にテーマを適用
          if (settings.theme === 'auto') {
            try {
              const themeInfo = await window.electron.theme.get();
              const systemTheme = themeInfo.shouldUseDarkColors ? 'dark' : 'light';
              setActualTheme(systemTheme);
            } catch (error) {
              console.error('Failed to get initial system theme:', error);
            }
          } else {
            setActualTheme(settings.theme as 'light' | 'dark');
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        // 設定読み込み完了（成功/失敗/スキップに関わらず）
        settingsLoaded.current = true;
        // 設定読み込みの成否に関わらず、セッションを初期化
        initializeSession();
      }
    };

    loadInitialSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空の依存配列で初回のみ実行

  // テーマ適用とシステムテーマ監視
  useEffect(() => {
    // 設定が読み込まれるまで待つ（初回のみ）
    if (!settingsLoaded.current) return;

    // Electron APIが利用可能かチェック
    if (!window.electron) {
      console.warn('Electron API is not available. Running in browser mode.');
      if (theme !== 'auto') {
        setActualTheme(theme as 'light' | 'dark');
      }
      return;
    }

    // autoモードの場合はシステムテーマを取得・監視
    if (theme === 'auto') {
      const initTheme = async () => {
        try {
          const themeInfo = await window.electron.theme.get();
          const systemTheme = themeInfo.shouldUseDarkColors ? 'dark' : 'light';
          setActualTheme(systemTheme);
        } catch (error) {
          console.error('Failed to get theme:', error);
        }
      };

      initTheme();

      // システムテーマ変更のリスナー
      window.electron.theme.onChanged((themeInfo) => {
        const systemTheme = themeInfo.shouldUseDarkColors ? 'dark' : 'light';
        setActualTheme(systemTheme);
      });

      return () => {
        window.electron.theme.removeListener();
      };
    } else {
      // 明示的なテーマ設定（light/dark）の場合
      setActualTheme(theme as 'light' | 'dark');
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
        const currentCompactMode =
          useDiffStore.getState().getActiveSession()?.options.compactMode ?? false;
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
        actualTheme={actualTheme}
      />
      <main className="main-content">
        <DiffEditor ref={diffEditorRef} theme={actualTheme} />
      </main>
      <Footer />
      <SettingsModal />
      <UpdateNotification theme={actualTheme} />
    </div>
  );
};

export default App;
