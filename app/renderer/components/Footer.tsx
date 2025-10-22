import type React from 'react';
import { useDiffStore } from '../stores/diffStore';
import './Footer.css';

const Footer: React.FC = () => {
  const {
    getActiveSession,
    updateLeftBufferEOL,
    updateRightBufferEOL,
    updateBuffersLang,
    updateOptions,
    openSettingsModal,
    devMode,
  } = useDiffStore();
  const activeSession = getActiveSession();

  if (!activeSession) return null;

  const stats = activeSession.stats;
  const leftEOL = activeSession.left.eol;
  const rightEOL = activeSession.right.eol;
  const language = activeSession.left.lang || 'plaintext';
  const fontSize = activeSession.options.fontSize;
  const insertSpaces = activeSession.options.insertSpaces;
  const tabSize = activeSession.options.tabSize;

  // サポートする言語リスト
  const supportedLanguages = [
    { value: 'plaintext', label: 'Plain Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'scss', label: 'SCSS' },
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'sql', label: 'SQL' },
    { value: 'shell', label: 'Shell' },
  ];

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateOptions({ fontSize: Number(e.target.value) });
  };

  const handleIndentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateOptions({ insertSpaces: e.target.value === 'スペース' });
  };

  const handleIndentSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateOptions({ tabSize: Number(e.target.value) });
  };

  return (
    <footer className="app-footer">
      <div className="footer-section">
        {stats && (
          <>
            <span className="stat stat-add">+{stats.adds}</span>
            <span className="stat stat-del">-{stats.dels}</span>
            <span className="stat">{stats.hunks} hunks</span>
          </>
        )}
      </div>

      <div className="footer-section footer-controls">
        <span className="info-label">フォントサイズ:</span>
        <select
          className="footer-select"
          value={fontSize}
          onChange={handleFontSizeChange}
          title="フォントサイズ"
        >
          <option value="10">10</option>
          <option value="12">12</option>
          <option value="14">14</option>
          <option value="16">16</option>
          <option value="18">18</option>
          <option value="20">20</option>
          <option value="22">22</option>
          <option value="24">24</option>
          <option value="26">26</option>
          <option value="28">28</option>
          <option value="30">30</option>
          <option value="32">32</option>
          <option value="34">34</option>
          <option value="36">36</option>
        </select>

        <span className="separator">|</span>

        <select
          className="footer-select"
          value={insertSpaces ? 'スペース' : 'タブ'}
          onChange={handleIndentTypeChange}
          title="インデント方式"
        >
          <option value="スペース">スペース</option>
          <option value="タブ">タブ</option>
        </select>
        <select
          className="footer-select footer-select-narrow"
          value={tabSize}
          onChange={handleIndentSizeChange}
          title="インデントサイズ"
        >
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="8">8</option>
        </select>

        <span className="separator">|</span>

        <span className="info-label">改行コード:</span>
        <select
          className="footer-select"
          value={leftEOL}
          onChange={(e) => updateLeftBufferEOL(e.target.value as 'LF' | 'CRLF' | 'auto')}
          title="Beforeの改行コード"
        >
          <option value="auto">Auto</option>
          <option value="LF">LF</option>
          <option value="CRLF">CRLF</option>
        </select>
        <select
          className="footer-select"
          value={rightEOL}
          onChange={(e) => updateRightBufferEOL(e.target.value as 'LF' | 'CRLF' | 'auto')}
          title="Afterの改行コード"
        >
          <option value="auto">Auto</option>
          <option value="LF">LF</option>
          <option value="CRLF">CRLF</option>
        </select>

        <span className="separator">|</span>

        <select
          className="footer-select footer-select-lang"
          value={language}
          onChange={(e) => updateBuffersLang(e.target.value)}
          title="言語モード"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="settings-icon-button"
          onClick={openSettingsModal}
          title="設定"
          aria-label="設定を開く"
        >
          ⚙
        </button>

        {devMode && (
          <span className="dev-mode-indicator" title="開発者モード有効">
            DEV
          </span>
        )}
      </div>
    </footer>
  );
};

export default Footer;
