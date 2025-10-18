import React from 'react';
import { useDiffStore } from '../stores/diffStore';
import './Header.css';

interface HeaderProps {
  onCompare?: () => void;
  onSwap?: () => void;
  onClear?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCompare, onSwap, onClear }) => {
  const { getActiveSession, updateOptions } = useDiffStore();
  const activeSession = getActiveSession();

  const handleViewModeChange = (mode: 'unified' | 'side-by-side') => {
    updateOptions({ viewMode: mode });
  };

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

  return (
    <header className="app-header">
      <div className="header-section">
        <h1 className="app-title">SnipDiff</h1>
      </div>

      <div className="header-section header-controls">
        {/* ビューモード切替 */}
        <div className="button-group">
          <button
            className={activeSession?.options.viewMode === 'unified' ? 'active' : ''}
            onClick={() => handleViewModeChange('unified')}
            title="Unified (⌘1)"
          >
            Unified
          </button>
          <button
            className={activeSession?.options.viewMode === 'side-by-side' ? 'active' : ''}
            onClick={() => handleViewModeChange('side-by-side')}
            title="Side by Side (⌘2)"
          >
            Side by Side
          </button>
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
            Case無視
          </button>
          <button
            className={activeSession?.options.wordWrap ? 'active' : ''}
            onClick={() => handleOptionToggle('wordWrap')}
            title="折り返し"
          >
            折り返し
          </button>
        </div>

        {/* アクション */}
        <div className="button-group">
          <button
            onClick={onCompare}
            className="compare-button"
            title="比較を実行"
          >
            比較
          </button>
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
