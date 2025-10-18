import React from 'react';
import { useDiffStore } from '../stores/diffStore';
import './Footer.css';

const Footer: React.FC = () => {
  const { getActiveSession } = useDiffStore();
  const activeSession = getActiveSession();

  if (!activeSession) return null;

  const stats = activeSession.stats;
  const leftEOL = activeSession.left.eol;
  const rightEOL = activeSession.right.eol;

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

      <div className="footer-section">
        <span className="info">Left: {leftEOL}</span>
        <span className="separator">|</span>
        <span className="info">Right: {rightEOL}</span>
        <span className="separator">|</span>
        <span className="info">
          {activeSession.left.lang || 'plaintext'}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
