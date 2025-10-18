import React from 'react';
import { useDiffStore } from '../stores/diffStore';
import './Footer.css';

const Footer: React.FC = () => {
  const { getActiveSession, updateLeftBufferEOL, updateRightBufferEOL, updateBuffersLang } = useDiffStore();
  const activeSession = getActiveSession();

  if (!activeSession) return null;

  const stats = activeSession.stats;
  const leftEOL = activeSession.left.eol;
  const rightEOL = activeSession.right.eol;
  const language = activeSession.left.lang || 'plaintext';

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
