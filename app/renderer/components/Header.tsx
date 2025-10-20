import type React from 'react';
import { useDiffStore } from '../stores/diffStore';
import './Header.css';

interface HeaderProps {
  onCompare?: () => void;
  onSwap?: () => void;
  onClear?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSwap, onClear }) => {
  const { getActiveSession, updateOptions } = useDiffStore();
  const activeSession = getActiveSession();

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

  return (
    <header className="app-header">
      <div className="header-section">
        <h1 className="app-title">SnipDiff</h1>
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
