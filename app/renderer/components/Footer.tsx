import React from 'react';
import { useDiffStore } from '../stores/diffStore';
import type { Theme } from '@shared/types';
import './Footer.css';

const Footer: React.FC = () => {
  const { getActiveSession, updateLeftBufferEOL, updateRightBufferEOL, updateBuffersLang, updateOptions, theme, setTheme } = useDiffStore();
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

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateOptions({ fontSize: Number(e.target.value) });
  };

  const handleIndentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateOptions({ insertSpaces: e.target.value === 'spaces' });
  };

  const handleTabSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        <span className="info-label">Theme:</span>
        <select
          className="footer-select"
          value={theme}
          onChange={handleThemeChange}
          title="テーマ"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>

        <span className="separator">|</span>

        <span className="info-label">Font Size:</span>
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
        </select>

        <span className="separator">|</span>

        <span className="info-label">Indent:</span>
        <select
          className="footer-select"
          value={insertSpaces ? 'spaces' : 'tabs'}
          onChange={handleIndentChange}
          title="インデント方式"
        >
          <option value="spaces">Spaces</option>
          <option value="tabs">Tabs</option>
        </select>

        <span className="separator">|</span>

        <span className="info-label">Tab Size:</span>
        <select
          className="footer-select"
          value={tabSize}
          onChange={handleTabSizeChange}
          title="タブサイズ"
        >
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="8">8</option>
        </select>

        <span className="separator">|</span>

        <span className="info-label">Before:</span>
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

        <span className="separator">|</span>

        <span className="info-label">After:</span>
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
          title="シンタックスハイライトの言語"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </footer>
  );
};

export default Footer;
