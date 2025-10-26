import type { DiffOptions, Theme } from '@shared/types';
import type React from 'react';
import { useEffect, useId, useState } from 'react';
import { ClipboardList, Settings as SettingsIcon, Wrench } from 'lucide-react';
import {
  INITIAL_DEFAULT_EOL,
  INITIAL_DEFAULT_LANGUAGE,
  INITIAL_DEFAULT_OPTIONS,
  INITIAL_DEFAULT_THEME,
  useDiffStore,
} from '../stores/diffStore';
import './SettingsModal.css';

type CategoryType = 'general' | 'defaults' | 'developer';

interface Category {
  id: CategoryType;
  label: string;
  icon?: React.ReactNode;
}

const SettingsModal: React.FC = () => {
  const titleId = useId();
  const {
    isSettingsModalOpen,
    closeSettingsModal,
    theme,
    defaultOptions,
    defaultLanguage,
    defaultEOL,
    devMode,
    isUpdateAvailable,
    setTheme,
    updateOptions,
    updateBuffersLang,
    updateLeftBufferEOL,
    updateRightBufferEOL,
  } = useDiffStore();

  // 開発環境かどうかを判定
  const isDev = import.meta.env.DEV;

  // カテゴリ定義
  const categories: Category[] = [
    { id: 'general', label: '一般', icon: <SettingsIcon size={20} /> },
    { id: 'defaults', label: 'デフォルト設定', icon: <ClipboardList size={20} /> },
    ...(isDev
      ? [{ id: 'developer' as CategoryType, label: '開発者向け', icon: <Wrench size={20} /> }]
      : []),
  ];

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('general');
  const [localTheme, setLocalTheme] = useState<Theme>(theme);
  const [localOptions, setLocalOptions] = useState<DiffOptions>(defaultOptions);
  const [localLanguage, setLocalLanguage] = useState(defaultLanguage);
  const [localEOL, setLocalEOL] = useState<'LF' | 'CRLF' | 'auto'>(defaultEOL);
  const [localAutoUpdate, setLocalAutoUpdate] = useState(false);
  const [localDevMode, setLocalDevMode] = useState(false);
  const [updateCheckState, setUpdateCheckState] = useState<
    'idle' | 'checking' | 'success' | 'error'
  >('idle');
  const [updateCheckMessage, setUpdateCheckMessage] = useState('');
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string>('');

  // モーダルが開かれたら現在の設定を読み込む
  useEffect(() => {
    if (isSettingsModalOpen) {
      setLocalTheme(theme);
      setLocalOptions(defaultOptions);
      setLocalLanguage(defaultLanguage);
      setLocalEOL(defaultEOL);
      setLocalDevMode(devMode);

      // 自動更新設定を読み込む
      window.electron?.settings.get().then((settings) => {
        setLocalAutoUpdate(settings.autoUpdate ?? true);
      });

      // 最終確認日を読み込む
      const savedLastCheck = localStorage.getItem('lastUpdateCheck');
      if (savedLastCheck) {
        setLastUpdateCheck(savedLastCheck);
      }
    }
  }, [isSettingsModalOpen, theme, defaultOptions, defaultLanguage, defaultEOL, devMode]);

  // 更新チェック結果のイベントリスナー
  useEffect(() => {
    if (!window.electron?.updater) return;

    // 更新が利用可能な場合
    const handleUpdateAvailable = () => {
      // UpdateNotificationコンポーネントで表示されるため、
      // SettingsModalではメッセージを非表示にする
      setUpdateCheckState('idle');
      setUpdateCheckMessage('');
    };

    // 更新が利用不可の場合
    const handleUpdateNotAvailable = () => {
      setUpdateCheckState('success');
      setUpdateCheckMessage('最新バージョンです');

      setTimeout(() => {
        setUpdateCheckState('idle');
        setUpdateCheckMessage('');
      }, 3000);
    };

    window.electron.updater.onUpdateAvailable(handleUpdateAvailable);
    window.electron.updater.onUpdateNotAvailable(handleUpdateNotAvailable);

    // クリーンアップは不要（removeAllListenersが全て削除するため）
  }, []);

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
        autoUpdate: localAutoUpdate,
        // 開発環境の場合のみdevModeを保存
        ...(isDev ? { devMode: localDevMode } : {}),
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

  const handleReset = () => {
    // 確認ダイアログ表示
    const confirmed = window.confirm(
      '設定をデフォルト値にリセットしますか？\n\nこの操作により、すべての設定が初期値に戻ります。\n（「保存」ボタンを押すまで永続化されません）'
    );

    if (!confirmed) {
      return;
    }

    // ローカル状態をデフォルト値に更新（プレビュー表示）
    setLocalTheme(INITIAL_DEFAULT_THEME);
    setLocalOptions({ ...INITIAL_DEFAULT_OPTIONS });
    setLocalLanguage(INITIAL_DEFAULT_LANGUAGE);
    setLocalEOL(INITIAL_DEFAULT_EOL);
    setLocalAutoUpdate(true);
    // 開発環境の場合のみdevModeをリセット
    if (isDev) {
      setLocalDevMode(false);
    }
  };

  const handleCheckForUpdates = async () => {
    if (!window.electron?.updater) return;

    setUpdateCheckState('checking');
    setUpdateCheckMessage('更新を確認中...');

    try {
      // 更新チェックを実行
      await window.electron.updater.checkForUpdates();

      // 最終確認日時を更新
      const now = new Date();
      const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLastUpdateCheck(formattedDate);
      localStorage.setItem('lastUpdateCheck', formattedDate);

      // 結果はイベントリスナーで処理される
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateCheckState('error');
      setUpdateCheckMessage('更新チェックに失敗しました');

      setTimeout(() => {
        setUpdateCheckState('idle');
        setUpdateCheckMessage('');
      }, 3000);
    }
  };

  // キーボードナビゲーション（矢印キー）
  const handleCategoryKeyDown = (e: React.KeyboardEvent, categoryId: CategoryType) => {
    const currentIndex = categories.findIndex((cat) => cat.id === categoryId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % categories.length;
      setSelectedCategory(categories[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + categories.length) % categories.length;
      setSelectedCategory(categories[prevIndex].id);
    }
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

  // 一般カテゴリの内容
  const renderGeneralSettings = () => (
    <>
      <div className="settings-section">
        <span className="settings-label">テーマ</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localTheme}
            onChange={(e) => setLocalTheme(e.target.value as Theme)}
          >
            <option value="light">ライトテーマ</option>
            <option value="dark">ダークテーマ</option>
            <option value="auto">システムテーマ (デフォルト値)</option>
          </select>
        </div>
        <span className="settings-description">
          エディターの外観を変更します。「システムテーマ」を選択すると、macOSの設定に従います。
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">自動更新チェック</span>
        <div className="settings-control">
          <label className="settings-checkbox-label">
            <input
              type="checkbox"
              checked={localAutoUpdate}
              onChange={(e) => setLocalAutoUpdate(e.target.checked)}
              aria-label="自動更新チェック"
            />
          </label>
        </div>
        <span className="settings-description">
          アプリ起動時に自動的に更新をチェックします。新しいバージョンが見つかった場合は通知が表示されます。(デフォルト値:
          オン)
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">更新確認</span>
        <div className="settings-control">
          <button
            type="button"
            className="update-check-button"
            onClick={handleCheckForUpdates}
            disabled={updateCheckState === 'checking' || isUpdateAvailable}
          >
            {updateCheckState === 'checking'
              ? '確認中...'
              : isUpdateAvailable
                ? '新しいバージョンが利用可能です'
                : '今すぐ更新を確認'}
          </button>
          {updateCheckMessage ? (
            <span className={`update-check-message ${updateCheckState}`}>{updateCheckMessage}</span>
          ) : lastUpdateCheck ? (
            <span className="last-update-check">最終確認: {lastUpdateCheck}</span>
          ) : null}
        </div>
        <span className="settings-description">今すぐ新しいバージョンを確認します。</span>
      </div>
    </>
  );

  // デフォルト設定カテゴリの内容
  const renderDefaultsSettings = () => (
    <>
      <div className="settings-section-group">
        <h3 className="settings-section-title">エディター設定</h3>
        <p className="settings-section-description">エディターのデフォルト動作を設定します。</p>
      </div>

      <div className="settings-section">
        <span className="settings-label">フォントサイズ</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localOptions.fontSize}
            onChange={(e) => setLocalOptions({ ...localOptions, fontSize: Number(e.target.value) })}
          >
            <option value="10">10</option>
            <option value="12">12</option>
            <option value="14">14 (デフォルト値)</option>
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
        </div>
        <span className="settings-description">
          エディターで表示されるテキストのサイズを変更します。
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">空白文字の表示</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localOptions.renderWhitespace}
            onChange={(e) =>
              setLocalOptions({
                ...localOptions,
                renderWhitespace: e.target.value as
                  | 'none'
                  | 'boundary'
                  | 'selection'
                  | 'trailing'
                  | 'all',
              })
            }
          >
            <option value="none">可視化しない</option>
            <option value="boundary">単語境界のみ可視化</option>
            <option value="selection">選択時のみ可視化</option>
            <option value="trailing">行末のみ可視化</option>
            <option value="all">すべて可視化 (デフォルト値)</option>
          </select>
        </div>
        <div className="settings-description">
          <p style={{ margin: '0 0 8px 0' }}>
            空白文字（スペース・タブ）を記号で可視化する方法を選択します：
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ minWidth: '160px' }}>
                • <strong>可視化しない</strong>
              </span>
              <span>
                空白文字を通常通り表示します（記号で表示しない）。通常のテキストエディタと同じ表示です。
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ minWidth: '160px' }}>
                • <strong>単語境界のみ可視化</strong>
              </span>
              <span>
                単語と単語の間のスペースのみを記号で表示します。行頭や行末の空白は表示しません。
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ minWidth: '160px' }}>
                • <strong>選択時のみ可視化</strong>
              </span>
              <span>テキストを選択したときだけ空白文字を記号で表示します。</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ minWidth: '160px' }}>
                • <strong>行末のみ可視化</strong>
              </span>
              <span>
                行末の余分なスペースやタブのみを記号で表示します。コードの品質チェックに便利です。
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ minWidth: '160px' }}>
                • <strong>すべて可視化</strong>
              </span>
              <span>
                すべてのスペースとタブを記号で表示します。インデントや空白の問題を確認するときに便利です。
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <span className="settings-label">インデント方式</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localOptions.insertSpaces ? 'スペース' : 'タブ'}
            onChange={(e) =>
              setLocalOptions({ ...localOptions, insertSpaces: e.target.value === 'スペース' })
            }
          >
            <option value="スペース">スペース (デフォルト値)</option>
            <option value="タブ">タブ</option>
          </select>
        </div>
        <span className="settings-description">
          Tabキーを押したときにスペースまたはタブ文字のどちらを挿入するかを設定します。
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">インデントサイズ</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localOptions.tabSize}
            onChange={(e) => setLocalOptions({ ...localOptions, tabSize: Number(e.target.value) })}
          >
            <option value="2">2</option>
            <option value="4">4 (デフォルト値)</option>
            <option value="8">8</option>
          </select>
        </div>
        <span className="settings-description">
          インデント1つあたりのスペース数、またはタブ文字の表示幅を設定します。
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">デフォルト改行コード</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localEOL}
            onChange={(e) => setLocalEOL(e.target.value as 'LF' | 'CRLF' | 'auto')}
          >
            <option value="auto">Auto (デフォルト値)</option>
            <option value="LF">LF</option>
            <option value="CRLF">CRLF</option>
          </select>
        </div>
        <span className="settings-description">
          新規入力時の改行コードを設定します（LF: Unix/Mac、CRLF: Windows、Auto: OSに従う）。
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">デフォルト言語モード</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localLanguage}
            onChange={(e) => setLocalLanguage(e.target.value)}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
                {lang.value === 'plaintext' && ' (デフォルト値)'}
              </option>
            ))}
          </select>
        </div>
        <span className="settings-description">
          シンタックスハイライトに使用する言語を設定します。コードの構文に応じた色分けが適用されます。
        </span>
      </div>

      <div className="settings-section-group">
        <h3 className="settings-section-title">差分設定</h3>
        <p className="settings-section-description">差分表示のデフォルト動作を設定します。</p>
      </div>

      <div className="settings-section">
        <span className="settings-label">比較の方式</span>
        <div className="settings-control">
          <select
            className="settings-select"
            value={localOptions.viewMode}
            onChange={(e) =>
              setLocalOptions({
                ...localOptions,
                viewMode: e.target.value as 'unified' | 'side-by-side',
              })
            }
          >
            <option value="side-by-side">Side by Side (デフォルト値)</option>
            <option value="unified">Unified</option>
          </select>
        </div>
        <span className="settings-description">
          Side by Side（左右並べて表示）またはUnified（統合表示）を選択できます。
        </span>
      </div>

      <div className="settings-section">
        <span className="settings-label">Compactモード</span>
        <div className="settings-control">
          <label className="settings-checkbox-label">
            <input
              type="checkbox"
              checked={localOptions.compactMode || false}
              onChange={(e) => setLocalOptions({ ...localOptions, compactMode: e.target.checked })}
              aria-label="Compactモード"
            />
            <span>有効</span>
          </label>
        </div>
        <span className="settings-description">
          行レベルの背景色を削除し、実際に変更された文字だけを精密にハイライト表示します。(デフォルト値:
          オフ)
        </span>
      </div>
    </>
  );

  // 開発者向けカテゴリの内容
  const renderDeveloperSettings = () => (
    <>
      <div className="settings-section-group">
        <h3 className="settings-section-title">開発者向け設定</h3>
        <p className="settings-section-description">開発環境でのみ利用可能な設定です。</p>
      </div>

      <div className="settings-section">
        <span className="settings-label">開発者モード</span>
        <div className="settings-control">
          <label className="settings-checkbox-label">
            <input
              type="checkbox"
              checked={localDevMode}
              onChange={(e) => setLocalDevMode(e.target.checked)}
            />
          </label>
        </div>
        <span className="settings-description">
          開発者モードが有効になります。(デフォルト値: オフ)
        </span>
      </div>
    </>
  );

  // 選択されたカテゴリの内容をレンダリング
  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'general':
        return renderGeneralSettings();
      case 'defaults':
        return renderDefaultsSettings();
      case 'developer':
        return renderDeveloperSettings();
      default:
        return null;
    }
  };

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
        <div className="settings-modal-content">
          {/* 左サイドバー: カテゴリナビゲーション */}
          <aside className="settings-sidebar" role="navigation" aria-label="設定カテゴリ">
            <button
              type="button"
              className="settings-modal-close"
              onClick={handleCancel}
              aria-label="閉じる"
            >
              ×
            </button>
            <nav className="settings-category-nav">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`settings-category-item ${
                    selectedCategory === category.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  onKeyDown={(e) => handleCategoryKeyDown(e, category.id)}
                  aria-current={selectedCategory === category.id ? 'page' : undefined}
                  tabIndex={0}
                >
                  {category.icon && <span className="settings-category-icon">{category.icon}</span>}
                  <span className="settings-category-label">{category.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* 右コンテンツエリア: 選択されたカテゴリの設定内容 */}
          <div className="settings-content">
            <div className="settings-content-header">
              <h2 className="settings-content-header-title">
                {categories.find((cat) => cat.id === selectedCategory)?.label}
              </h2>
            </div>
            <div className="settings-content-inner">{renderCategoryContent()}</div>
          </div>
        </div>

        <div className="settings-modal-footer">
          <button
            type="button"
            className="settings-button settings-button-reset"
            onClick={handleReset}
            title="すべての設定をデフォルト値にリセットします"
          >
            デフォルトにリセット
          </button>
          <div className="settings-footer-right">
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
    </div>
  );
};

export default SettingsModal;
