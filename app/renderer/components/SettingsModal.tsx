import type React from 'react';
import { useState, useEffect, useId } from 'react';
import { useDiffStore } from '../stores/diffStore';
import type { Theme, DiffOptions } from '@shared/types';
import './SettingsModal.css';

const SettingsModal: React.FC = () => {
  const titleId = useId();
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    theme,
    defaultOptions,
    defaultLanguage,
    defaultEOL,
    setTheme,
    updateOptions,
    updateBuffersLang,
    updateLeftBufferEOL,
    updateRightBufferEOL,
  } = useDiffStore();

  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [localOptions, setLocalOptions] = useState<DiffOptions>(defaultOptions);
  const [localLanguage, setLocalLanguage] = useState(defaultLanguage);
  const [localEOL, setLocalEOL] = useState<'LF' | 'CRLF' | 'auto'>(defaultEOL);

  // モーダルが開かれたら現在の設定を読み込む
  useEffect(() => {
    if (isSettingsModalOpen) {
      setLocalTheme(theme);
      setLocalOptions(defaultOptions);
      setLocalLanguage(defaultLanguage);
      setLocalEOL(defaultEOL);
    }
  }, [isSettingsModalOpen, theme, defaultOptions, defaultLanguage, defaultEOL]);

  const handleSave = async () => {
    try {
      // undefinedチェック
      const safeLocalEOL = localEOL || 'auto';
      const safeLocalLanguage = localLanguage || 'plaintext';

      const settings = {
        theme: localTheme,
        defaultOptions: localOptions,
        defaultLanguage: safeLocalLanguage,
        defaultEOL: safeLocalEOL,
      };

      const result = await window.electron.settings.set(settings);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      // ストアにも反映（デフォルト値として保存）
      useDiffStore.getState().loadSettings(settings);

      // 現在のセッションにも即座に反映
      setTheme(localTheme);
      updateOptions(localOptions);
      updateBuffersLang(safeLocalLanguage);
      updateLeftBufferEOL(safeLocalEOL);
      updateRightBufferEOL(safeLocalEOL);

      closeSettingsModal();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(`設定の保存に失敗しました: ${error}`);
    }
  };

  const handleCancel = () => {
    closeSettingsModal();
  };

  if (!isSettingsModalOpen) return null;

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
    <div
      className="settings-modal-overlay"
      onClick={handleCancel}
      onKeyDown={(e) => e.key === 'Escape' && handleCancel()}
      role="button"
      tabIndex={0}
      aria-label="モーダルを閉じる"
    >
      <div
        className="settings-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="settings-modal-header">
          <h2 id={titleId}>デフォルト設定</h2>
          <button
            type="button"
            className="settings-modal-close"
            onClick={handleCancel}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="settings-modal-body">
          <div className="settings-section">
            <label className="settings-label">
              テーマ
              <select
                className="settings-select"
                value={localTheme}
                onChange={(e) => setLocalTheme(e.target.value as Theme)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">
              フォントサイズ
              <select
                className="settings-select"
                value={localOptions.fontSize}
                onChange={(e) => setLocalOptions({ ...localOptions, fontSize: Number(e.target.value) })}
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
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">
              比較の方式
              <select
                className="settings-select"
                value={localOptions.viewMode}
                onChange={(e) => setLocalOptions({ ...localOptions, viewMode: e.target.value as 'unified' | 'side-by-side' })}
              >
                <option value="side-by-side">Side by Side</option>
                <option value="unified">Unified</option>
              </select>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-checkbox-label">
              <input
                type="checkbox"
                checked={localOptions.compactMode || false}
                onChange={(e) => setLocalOptions({ ...localOptions, compactMode: e.target.checked })}
              />
              <span>Compactモード</span>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">
              インデント方式
              <select
                className="settings-select"
                value={localOptions.insertSpaces ? 'spaces' : 'tabs'}
                onChange={(e) => setLocalOptions({ ...localOptions, insertSpaces: e.target.value === 'spaces' })}
              >
                <option value="spaces">Spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">
              タブサイズ
              <select
                className="settings-select"
                value={localOptions.tabSize}
                onChange={(e) => setLocalOptions({ ...localOptions, tabSize: Number(e.target.value) })}
              >
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
              </select>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">
              デフォルト言語
              <select
                className="settings-select"
                value={localLanguage}
                onChange={(e) => setLocalLanguage(e.target.value)}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-label">
              デフォルト改行コード
              <select
                className="settings-select"
                value={localEOL}
                onChange={(e) => setLocalEOL(e.target.value as 'LF' | 'CRLF' | 'auto')}
              >
                <option value="auto">Auto</option>
                <option value="LF">LF</option>
                <option value="CRLF">CRLF</option>
              </select>
            </label>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button
            type="button"
            className="settings-button settings-button-cancel"
            onClick={handleCancel}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="settings-button settings-button-save"
            onClick={handleSave}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
