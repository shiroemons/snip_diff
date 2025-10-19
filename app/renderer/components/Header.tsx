import React from 'react';
import { useDiffStore } from '../stores/diffStore';
import type { Theme } from '@shared/types';
import { SUPPORTED_LANGUAGES } from '@shared/constants';
import './Header.css';

interface HeaderProps {
  onCompare?: () => void;
  onSwap?: () => void;
  onClear?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSwap, onClear }) => {
  const { getActiveSession, updateOptions, theme, setTheme, updateBuffersLang } = useDiffStore();
  const activeSession = getActiveSession();

  const handleOptionToggle = (option: string) => {
    if (!activeSession) return;

    switch (option) {
      case 'ignoreWhitespace':
        updateOptions({ ignoreWhitespace: !activeSession.options.ignoreWhitespace });
        break;
      case 'ignoreCase':
        updateOptions({ ignoreCase: !activeSession.options.ignoreCase });
        break;
      case 'normalizeEOL':
        updateOptions({ normalizeEOL: !activeSession.options.normalizeEOL });
        break;
      case 'wordWrap':
        updateOptions({ wordWrap: !activeSession.options.wordWrap });
        break;
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateBuffersLang(e.target.value);
  };

  return (
    <header className="app-header">
      <div className="header-section">
        <h1 className="app-title">SnipDiff</h1>
      </div>

      <div className="header-section header-controls">
        {/* 言語選択 */}
        <div className="language-selector">
          <select
            value={activeSession?.left.lang || 'plaintext'}
            onChange={handleLanguageChange}
            title="シンタックスハイライトの言語を選択"
            className="language-select"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* オプション */}
        <div className="button-group">
          <button
            className={activeSession?.options.ignoreWhitespace ? 'active' : ''}
            onClick={() => handleOptionToggle('ignoreWhitespace')}
            title="空白を無視"
          >
            空白無視
          </button>
          <button
            className={activeSession?.options.ignoreCase ? 'active' : ''}
            onClick={() => handleOptionToggle('ignoreCase')}
            title="大文字小文字を無視"
          >
            大文字小文字を無視
          </button>
          <button
            className={activeSession?.options.wordWrap ? 'active' : ''}
            onClick={() => handleOptionToggle('wordWrap')}
            title="折り返し"
          >
            折り返し
          </button>
        </div>

        {/* テーマ切替 */}
        <div className="theme-toggle-group">
          <button
            className={theme === 'light' ? 'active' : ''}
            onClick={() => handleThemeChange('light')}
            title="Light テーマ"
          >
            ☀️
          </button>
          <button
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => handleThemeChange('dark')}
            title="Dark テーマ"
          >
            🌙
          </button>
          <button
            className={theme === 'auto' ? 'active' : ''}
            onClick={() => handleThemeChange('auto')}
            title="Auto（システム設定に従う）"
          >
            Auto
          </button>
        </div>

        {/* アクション */}
        <div className="button-group">
          <button onClick={onSwap} title="左右を入れ替え (⌘⇧K)">
            ↔ 入替
          </button>
          <button onClick={onClear} title="クリア (⌘K)">
            クリア
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
