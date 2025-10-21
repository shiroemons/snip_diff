import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useDiffStore } from '../stores/diffStore';
import type { Theme } from '@shared/types';
import './Header.css';

interface HeaderProps {
  onCompare?: () => void;
  onSwap?: () => void;
  onClear?: () => void;
  actualTheme?: 'light' | 'dark';
}

const Header: React.FC<HeaderProps> = ({ onSwap, onClear, actualTheme = 'dark' }) => {
  const { getActiveSession, updateOptions, theme, setTheme } = useDiffStore();
  const activeSession = getActiveSession();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const handleOptionToggle = (option: string) => {
    if (!activeSession) return;

    switch (option) {
      case 'ignoreWhitespace':
        updateOptions({ ignoreWhitespace: !activeSession.options.ignoreWhitespace });
        break;
      case 'normalizeEOL':
        updateOptions({ normalizeEOL: !activeSession.options.normalizeEOL });
        break;
      case 'wordWrap':
        updateOptions({ wordWrap: !activeSession.options.wordWrap });
        break;
    }
  };

  const handleThemeMenuToggle = () => {
    setIsThemeMenuOpen(!isThemeMenuOpen);
  };

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsThemeMenuOpen(false);
  };

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideButton = themeButtonRef.current?.contains(target);
      const isClickInsideMenu = themeMenuRef.current?.contains(target);

      if (!isClickInsideButton && !isClickInsideMenu) {
        setIsThemeMenuOpen(false);
      }
    };

    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  // システムテーマを取得・監視
  useEffect(() => {
    if (!window.electron) return;

    const initSystemTheme = async () => {
      try {
        const themeInfo = await window.electron.theme.get();
        const currentSystemTheme = themeInfo.shouldUseDarkColors ? 'dark' : 'light';
        setSystemTheme(currentSystemTheme);
      } catch (error) {
        console.error('Failed to get system theme:', error);
      }
    };

    initSystemTheme();

    // システムテーマ変更のリスナー
    window.electron.theme.onChanged((themeInfo) => {
      const currentSystemTheme = themeInfo.shouldUseDarkColors ? 'dark' : 'light';
      setSystemTheme(currentSystemTheme);
    });

    return () => {
      window.electron.theme.removeListener();
    };
  }, []);

  const getThemeIcon = (themeValue: Theme) => {
    switch (themeValue) {
      case 'light':
        return <Sun size={16} />;
      case 'dark':
        return <Moon size={16} />;
      case 'auto':
        // システムテーマの場合は実際のテーマに応じたアイコンを表示
        return actualTheme === 'light' ? <Sun size={16} /> : <Moon size={16} />;
      default:
        return actualTheme === 'light' ? <Sun size={16} /> : <Moon size={16} />;
    }
  };

  const getThemeLabel = (themeValue: Theme) => {
    switch (themeValue) {
      case 'light':
        return 'ライトテーマ';
      case 'dark':
        return 'ダークテーマ';
      case 'auto':
        return 'システムテーマ';
      default:
        return 'システムテーマ';
    }
  };

  return (
    <header className="app-header">
      <div className="header-section">
        <h1 className="app-title">SnipDiff</h1>
        <div className="theme-menu-container">
          <button
            ref={themeButtonRef}
            type="button"
            className="theme-toggle-button"
            onClick={handleThemeMenuToggle}
            title={`テーマ: ${getThemeLabel(theme)}`}
            aria-label={`テーマメニュー - 現在: ${getThemeLabel(theme)}`}
            aria-expanded={isThemeMenuOpen}
          >
            {getThemeIcon(theme)}
          </button>
          {isThemeMenuOpen && (
            <div className="theme-dropdown-menu" ref={themeMenuRef}>
              <button
                type="button"
                className={`theme-menu-item ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('light')}
              >
                <Sun size={16} />
                <span>ライトテーマ</span>
              </button>
              <button
                type="button"
                className={`theme-menu-item ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('dark')}
              >
                <Moon size={16} />
                <span>ダークテーマ</span>
              </button>
              <button
                type="button"
                className={`theme-menu-item ${theme === 'auto' ? 'active' : ''}`}
                onClick={() => handleThemeSelect('auto')}
              >
                {systemTheme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                <span>システムテーマ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="header-section header-controls">
        {/* オプション */}
        <div className="button-group">
          <button
            type="button"
            className={activeSession?.options.ignoreWhitespace ? 'active' : ''}
            onClick={() => handleOptionToggle('ignoreWhitespace')}
            title="空白を無視"
          >
            空白無視
          </button>
          <button
            type="button"
            className={activeSession?.options.wordWrap ? 'active' : ''}
            onClick={() => handleOptionToggle('wordWrap')}
            title="折り返し"
          >
            折り返し
          </button>
        </div>

        {/* アクション */}
        <div className="button-group">
          <button type="button" onClick={onSwap} title="左右を入れ替え (⌘⇧K)">
            ↔ 入替
          </button>
          <button type="button" onClick={onClear} title="クリア (⌘K)">
            クリア
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
