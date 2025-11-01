import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiffStore } from '../stores/diffStore';
import SettingsModal from './SettingsModal';

// Mock Electron API
const mockElectronAPI = {
  clipboard: {
    read: vi.fn().mockResolvedValue(''),
    write: vi.fn().mockResolvedValue(true),
    getHistory: vi.fn().mockResolvedValue([]),
    addToHistory: vi.fn().mockResolvedValue({ id: '1', content: '', timestamp: Date.now() }),
  },
  file: {
    save: vi.fn().mockResolvedValue({ success: true }),
    open: vi.fn().mockResolvedValue({ success: true }),
  },
  settings: {
    get: vi.fn().mockResolvedValue({
      theme: 'auto',
      accentColor: 'blue',
      defaultOptions: {
        ignoreWhitespace: false,
        normalizeEOL: true,
        viewMode: 'side-by-side',
        compactMode: false,
        wordWrap: false,
        tabSize: 4,
        fontSize: 14,
        insertSpaces: true,
        diffAlgorithm: 'advanced',
        hideUnchangedRegions: false,
        renderWhitespace: 'all',
        renderControlCharacters: true,
        unicodeHighlight: {
          invisibleCharacters: true,
          ambiguousCharacters: true,
          nonBasicASCII: false,
          includeComments: true,
          includeStrings: true,
        },
      },
      defaultLanguage: 'plaintext',
      defaultEOL: 'auto',
      autoUpdate: true,
      devMode: true, // 開発者モードを有効にしてテストを実行
    }),
    set: vi.fn().mockResolvedValue({ success: true }),
    onOpen: vi.fn(),
    removeListener: vi.fn(),
  },
  theme: {
    get: vi.fn(),
    onChanged: vi.fn(),
    removeListener: vi.fn(),
  },
  window: {
    close: vi.fn().mockResolvedValue(undefined),
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizedChanged: vi.fn(),
    removeMaximizedListener: vi.fn(),
  },
  view: {
    onModeChange: vi.fn(),
    onToggleCompact: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  updater: {
    checkForUpdates: vi.fn().mockResolvedValue(undefined),
    downloadUpdate: vi.fn().mockResolvedValue(undefined),
    installUpdate: vi.fn().mockResolvedValue(undefined),
    onUpdateAvailable: vi.fn(),
    onUpdateNotAvailable: vi.fn(),
    onDownloadProgress: vi.fn(),
    onUpdateDownloaded: vi.fn(),
    onError: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  platform: 'darwin' as NodeJS.Platform,
};

describe('SettingsModal', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDiffStore.setState({
      sessions: [],
      activeSessionId: null,
      theme: 'auto',
      isSettingsModalOpen: false,
      defaultOptions: {
        ignoreWhitespace: false,
        normalizeEOL: true,
        viewMode: 'side-by-side',
        compactMode: false,
        wordWrap: false,
        tabSize: 4,
        fontSize: 14,
        insertSpaces: true,
        diffAlgorithm: 'advanced',
        hideUnchangedRegions: false,
        renderWhitespace: 'all',
        renderControlCharacters: true,
        unicodeHighlight: {
          invisibleCharacters: true,
          ambiguousCharacters: true,
          nonBasicASCII: false,
          includeComments: true,
          includeStrings: true,
        },
      },
      defaultLanguage: 'plaintext',
      defaultEOL: 'auto',
    });

    // Mock window.electron
    (global.window as Window & typeof globalThis).electron = mockElectronAPI;

    // Reset mocks
    vi.clearAllMocks();
    mockElectronAPI.settings.set.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('should not render when modal is closed', () => {
      const { container } = render(<SettingsModal />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when modal is open', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);
      await waitFor(() => {
        // モーダルが表示されていることを確認（閉じるボタンの存在で確認）
        expect(screen.getByLabelText('閉じる')).toBeTruthy();
      });
    });

    it('should display category navigation', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '一般' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'デフォルト設定' })).toBeTruthy();
      });
    });
  });

  describe('Font size selection', () => {
    it('should display current font size', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({
        isSettingsModalOpen: true,
        defaultOptions: {
          ignoreWhitespace: false,
          normalizeEOL: true,
          viewMode: 'side-by-side',
          compactMode: false,
          wordWrap: false,
          tabSize: 4,
          fontSize: 18,
          insertSpaces: true,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: false,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          unicodeHighlight: {
            invisibleCharacters: true,
            ambiguousCharacters: true,
            nonBasicASCII: false,
            includeComments: true,
            includeStrings: true,
          },
        },
      });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        const fontSizeSelects = screen.getAllByDisplayValue('18');
        expect(fontSizeSelects.length).toBeGreaterThan(0);
      });
    });

    it('should support maximum font size of 36', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      // フォントサイズのselect要素を取得（ラベルから親要素経由で探す）
      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSection = fontSizeLabel.closest('.settings-section') as HTMLElement;
      const fontSizeSelect = fontSizeSection.querySelector('select') as HTMLSelectElement;
      expect(fontSizeSelect).toBeTruthy();

      // 36を選択
      await user.selectOptions(fontSizeSelect, '36');
      expect(fontSizeSelect.value).toBe('36');

      // 保存ボタンをクリック
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      // settings.set が正しい値で呼ばれたことを確認
      expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultOptions: expect.objectContaining({
            fontSize: 36,
          }),
        })
      );
    });

    it('should have all font size options from 10 to 36', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        const fontSizeLabel = screen.getByText('フォントサイズ');
        const fontSizeSection = fontSizeLabel.closest('.settings-section') as HTMLElement;
        const fontSizeSelect = fontSizeSection.querySelector('select') as HTMLSelectElement;

        const expectedSizes = [
          '10',
          '12',
          '14',
          '16',
          '18',
          '20',
          '22',
          '24',
          '26',
          '28',
          '30',
          '32',
          '34',
          '36',
        ];
        const options = Array.from(fontSizeSelect.options).map((opt) => opt.value);

        expectedSizes.forEach((size) => {
          expect(options).toContain(size);
        });
      });
    });
  });

  describe('Theme selection', () => {
    it('should display current theme', async () => {
      useDiffStore.setState({
        isSettingsModalOpen: true,
        theme: 'dark',
      });

      render(<SettingsModal />);

      await waitFor(() => {
        const themeLabel = screen.getByText('テーマ');
        const themeSection = themeLabel.closest('.settings-section') as HTMLElement;
        const themeSelect = themeSection.querySelector('select') as HTMLSelectElement;
        expect(themeSelect.value).toBe('dark');
      });
    });

    it('should change theme when selected', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const themeLabel = screen.getByText('テーマ');
      const themeSection = themeLabel.closest('.settings-section') as HTMLElement;
      const themeSelect = themeSection.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(themeSelect, 'light');
      expect(themeSelect.value).toBe('light');
    });
  });

  describe('Modal actions', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      const state = useDiffStore.getState();
      expect(state.isSettingsModalOpen).toBe(false);
    });

    it('should save settings when save button is clicked', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockElectronAPI.settings.set).toHaveBeenCalled();
    });

    it('should close modal on Escape key', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const overlay = screen.getByRole('button', { name: 'モーダルを閉じる' });
      await user.type(overlay, '{Escape}');

      const state = useDiffStore.getState();
      expect(state.isSettingsModalOpen).toBe(false);
    });
  });

  describe('View mode selection', () => {
    it('should change view mode', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const viewModeLabel = screen.getByText('比較の方式');
      const viewModeSection = viewModeLabel.closest('.settings-section') as HTMLElement;
      const viewModeSelect = viewModeSection.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(viewModeSelect, 'unified');
      expect(viewModeSelect.value).toBe('unified');
    });
  });

  describe('Language selection', () => {
    it('should change default language', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const languageLabel = screen.getByText('デフォルト言語モード');
      const languageSection = languageLabel.closest('.settings-section') as HTMLElement;
      const languageSelect = languageSection.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(languageSelect, 'javascript');
      expect(languageSelect.value).toBe('javascript');
    });

    it('should save language setting and update store', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      // Change language to typescript
      const languageLabel = screen.getByText('デフォルト言語モード');
      const languageSection = languageLabel.closest('.settings-section') as HTMLElement;
      const languageSelect = languageSection.querySelector('select') as HTMLSelectElement;
      await user.selectOptions(languageSelect, 'typescript');

      // Save settings
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      await waitFor(() => {
        // Verify that settings are saved with the correct language
        expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
          expect.objectContaining({
            defaultLanguage: 'typescript',
          })
        );

        // Verify that store is updated
        const state = useDiffStore.getState();
        expect(state.defaultLanguage).toBe('typescript');
      });
    });
  });

  describe('Description texts', () => {
    beforeEach(() => {
      useDiffStore.setState({ isSettingsModalOpen: true });
    });

    it('should display theme description', async () => {
      render(<SettingsModal />);
      // テーマは一般カテゴリにあるのでそのまま表示されます
      await waitFor(() => {
        expect(screen.getByText(/エディターの外観を変更します/)).toBeTruthy();
        expect(
          screen.getByText(/システムテーマ.*を選択すると、macOSの設定に従います/)
        ).toBeTruthy();
      });
    });

    it('should display font size description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText('エディターで表示されるテキストのサイズを変更します。')
        ).toBeTruthy();
      });
    });

    it('should display view mode description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Side by Side.*左右並べて表示.*またはUnified.*統合表示/)
        ).toBeTruthy();
      });
    });

    it('should display compact mode description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            /行レベルの背景色を削除し、実際に変更された文字だけを精密にハイライト表示します/
          )
        ).toBeTruthy();
      });
    });

    it('should display indent method description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Tabキーを押したときにスペースまたはタブ文字のどちらを挿入するか/)
        ).toBeTruthy();
      });
    });

    it('should display indent size description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText(/インデント1つあたりのスペース数、またはタブ文字の表示幅/)
        ).toBeTruthy();
      });
    });

    it('should display EOL description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText(/新規入力時の改行コード.*LF: Unix\/Mac.*CRLF: Windows.*Auto: OSに従う/)
        ).toBeTruthy();
      });
    });

    it('should display language mode description', async () => {
      const user = userEvent.setup();
      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(
          screen.getByText(/シンタックスハイライトに使用する言語.*コードの構文に応じた色分け/)
        ).toBeTruthy();
      });
    });
  });

  describe('Compact mode toggle', () => {
    it('should toggle compact mode checkbox', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const compactCheckbox = screen.getByRole('checkbox', {
        name: /Compactモード/,
      }) as HTMLInputElement;
      expect(compactCheckbox.checked).toBe(false);

      await user.click(compactCheckbox);
      expect(compactCheckbox.checked).toBe(true);

      await user.click(compactCheckbox);
      expect(compactCheckbox.checked).toBe(false);
    });

    it('should save compact mode setting', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const compactCheckbox = screen.getByRole('checkbox', { name: /Compactモード/ });
      await user.click(compactCheckbox);

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultOptions: expect.objectContaining({
            compactMode: true,
          }),
        })
      );
    });
  });

  describe('Indent settings', () => {
    it('should change indent method from space to tab', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const indentMethodLabel = screen.getByText('インデント方式');
      const indentMethodSection = indentMethodLabel.closest('.settings-section') as HTMLElement;
      const indentMethodSelect = indentMethodSection.querySelector('select') as HTMLSelectElement;

      expect(indentMethodSelect.value).toBe('スペース');

      await user.selectOptions(indentMethodSelect, 'タブ');
      expect(indentMethodSelect.value).toBe('タブ');
    });

    it('should save indent method setting', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const indentMethodLabel = screen.getByText('インデント方式');
      const indentMethodSection = indentMethodLabel.closest('.settings-section') as HTMLElement;
      const indentMethodSelect = indentMethodSection.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(indentMethodSelect, 'タブ');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultOptions: expect.objectContaining({
            insertSpaces: false,
          }),
        })
      );
    });

    it('should change tab size', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const tabSizeLabel = screen.getByText('インデントサイズ');
      const tabSizeSection = tabSizeLabel.closest('.settings-section') as HTMLElement;
      const tabSizeSelect = tabSizeSection.querySelector('select') as HTMLSelectElement;

      expect(tabSizeSelect.value).toBe('4');

      await user.selectOptions(tabSizeSelect, '2');
      expect(tabSizeSelect.value).toBe('2');

      await user.selectOptions(tabSizeSelect, '8');
      expect(tabSizeSelect.value).toBe('8');
    });

    it('should save tab size setting', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const tabSizeLabel = screen.getByText('インデントサイズ');
      const tabSizeSection = tabSizeLabel.closest('.settings-section') as HTMLElement;
      const tabSizeSelect = tabSizeSection.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(tabSizeSelect, '2');

      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultOptions: expect.objectContaining({
            tabSize: 2,
          }),
        })
      );
    });
  });

  describe('EOL settings', () => {
    it('should change EOL setting', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const eolLabel = screen.getByText('デフォルト改行コード');
      const eolSection = eolLabel.closest('.settings-section') as HTMLElement;
      const eolSelect = eolSection.querySelector('select') as HTMLSelectElement;

      // Initial value should be 'auto'
      expect(eolSelect.value).toBe('auto');

      // Change to LF
      await user.selectOptions(eolSelect, 'LF');
      expect(eolSelect.value).toBe('LF');

      // Change to CRLF
      await user.selectOptions(eolSelect, 'CRLF');
      expect(eolSelect.value).toBe('CRLF');

      // Change back to auto
      await user.selectOptions(eolSelect, 'auto');
      expect(eolSelect.value).toBe('auto');
    });

    it('should save EOL setting', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const eolLabel = screen.getByText('デフォルト改行コード');
      const eolSection = eolLabel.closest('.settings-section') as HTMLElement;
      const eolSelect = eolSection.querySelector('select') as HTMLSelectElement;

      // Change to LF
      await user.selectOptions(eolSelect, 'LF');

      // Save settings
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultEOL: 'LF',
        })
      );
    });

    it('should save EOL setting and update store', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const eolLabel = screen.getByText('デフォルト改行コード');
      const eolSection = eolLabel.closest('.settings-section') as HTMLElement;
      const eolSelect = eolSection.querySelector('select') as HTMLSelectElement;

      // Change to CRLF
      await user.selectOptions(eolSelect, 'CRLF');

      // Save settings
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      await waitFor(() => {
        // Verify that settings are saved with the correct EOL
        expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
          expect.objectContaining({
            defaultEOL: 'CRLF',
          })
        );

        // Verify that store is updated
        const state = useDiffStore.getState();
        expect(state.defaultEOL).toBe('CRLF');
      });
    });
  });

  describe('Reset button', () => {
    beforeEach(() => {
      // Mock window.confirm
      vi.spyOn(window, 'confirm');
    });

    it('should render reset button', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      await waitFor(() => {
        const resetButton = screen.getByText('デフォルトにリセット');
        expect(resetButton).toBeTruthy();
        expect(resetButton.getAttribute('title')).toBe(
          'すべての設定をデフォルト値にリセットします'
        );
      });
    });

    it('should show confirmation dialog when reset button is clicked', async () => {
      const user = userEvent.setup();
      (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('設定をデフォルト値にリセットしますか？')
      );
    });

    it('should not reset settings when user cancels confirmation', async () => {
      const user = userEvent.setup();
      (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(false);

      useDiffStore.setState({
        isSettingsModalOpen: true,
        theme: 'dark',
        defaultOptions: {
          ignoreWhitespace: false,
          normalizeEOL: true,
          viewMode: 'side-by-side',
          compactMode: false,
          wordWrap: false,
          tabSize: 4,
          fontSize: 24,
          insertSpaces: true,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: false,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          unicodeHighlight: {
            invisibleCharacters: true,
            ambiguousCharacters: true,
            nonBasicASCII: false,
            includeComments: true,
            includeStrings: true,
          },
        },
      });

      render(<SettingsModal />);

      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      // デフォルト設定カテゴリに移動してフォントサイズをチェック
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      // UI上のフォントサイズは変更されていないことを確認
      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSection = fontSizeLabel.closest('.settings-section') as HTMLElement;
      const fontSizeSelect = fontSizeSection.querySelector('select') as HTMLSelectElement;
      expect(fontSizeSelect.value).toBe('24');
    });

    it('should reset all settings to defaults when user confirms', async () => {
      const user = userEvent.setup();
      (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);

      useDiffStore.setState({
        isSettingsModalOpen: true,
        theme: 'dark',
        defaultOptions: {
          ignoreWhitespace: true,
          normalizeEOL: false,
          viewMode: 'unified',
          compactMode: true,
          wordWrap: true,
          tabSize: 2,
          fontSize: 24,
          insertSpaces: false,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: true,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          unicodeHighlight: {
            invisibleCharacters: true,
            ambiguousCharacters: true,
            nonBasicASCII: false,
            includeComments: true,
            includeStrings: true,
          },
        },
        defaultLanguage: 'javascript',
        defaultEOL: 'CRLF',
      });

      render(<SettingsModal />);

      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      // UIがデフォルト値に更新されていることを確認
      // テーマは一般カテゴリにある（デフォルトで表示されている）
      const themeLabel = screen.getByText('テーマ');
      const themeSection = themeLabel.closest('.settings-section') as HTMLElement;
      const themeSelect = themeSection.querySelector('select') as HTMLSelectElement;
      expect(themeSelect.value).toBe('auto');

      // デフォルト設定カテゴリに移動
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSection = fontSizeLabel.closest('.settings-section') as HTMLElement;
      const fontSizeSelect = fontSizeSection.querySelector('select') as HTMLSelectElement;
      expect(fontSizeSelect.value).toBe('14');

      const viewModeLabel = screen.getByText('比較の方式');
      const viewModeSection = viewModeLabel.closest('.settings-section') as HTMLElement;
      const viewModeSelect = viewModeSection.querySelector('select') as HTMLSelectElement;
      expect(viewModeSelect.value).toBe('side-by-side');

      const tabSizeLabel = screen.getByText('インデントサイズ');
      const tabSizeSection = tabSizeLabel.closest('.settings-section') as HTMLElement;
      const tabSizeSelect = tabSizeSection.querySelector('select') as HTMLSelectElement;
      expect(tabSizeSelect.value).toBe('4');

      const languageLabel = screen.getByText('デフォルト言語モード');
      const languageSection = languageLabel.closest('.settings-section') as HTMLElement;
      const languageSelect = languageSection.querySelector('select') as HTMLSelectElement;
      expect(languageSelect.value).toBe('plaintext');

      const eolLabel = screen.getByText('デフォルト改行コード');
      const eolSection = eolLabel.closest('.settings-section') as HTMLElement;
      const eolSelect = eolSection.querySelector('select') as HTMLSelectElement;
      expect(eolSelect.value).toBe('auto');

      // 一般カテゴリに戻って自動更新チェックを確認
      const generalButton = screen.getByRole('button', { name: '一般' });
      await user.click(generalButton);

      const autoUpdateCheckbox = screen.getByLabelText('自動更新チェック') as HTMLInputElement;
      expect(autoUpdateCheckbox.checked).toBe(true);
    });

    it('should require save button click to persist reset changes', async () => {
      const user = userEvent.setup();
      (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);

      useDiffStore.setState({
        isSettingsModalOpen: true,
        theme: 'dark',
        defaultOptions: {
          ignoreWhitespace: false,
          normalizeEOL: true,
          viewMode: 'side-by-side',
          compactMode: false,
          wordWrap: false,
          tabSize: 4,
          fontSize: 24,
          insertSpaces: true,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: false,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          unicodeHighlight: {
            invisibleCharacters: true,
            ambiguousCharacters: true,
            nonBasicASCII: false,
            includeComments: true,
            includeStrings: true,
          },
        },
      });

      render(<SettingsModal />);

      // リセットボタンをクリック
      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      // この時点ではまだsettings.setは呼ばれていない
      expect(mockElectronAPI.settings.set).not.toHaveBeenCalled();

      // 保存ボタンをクリック
      const saveButton = screen.getByText('保存');
      await user.click(saveButton);

      // 保存が呼ばれ、デフォルト値が保存されることを確認
      expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
        expect.objectContaining({
          theme: 'auto',
          defaultOptions: expect.objectContaining({
            fontSize: 14,
            tabSize: 4,
            viewMode: 'side-by-side',
          }),
          defaultLanguage: 'plaintext',
          defaultEOL: 'auto',
        })
      );
    });

    it('should discard reset changes when cancel button is clicked', async () => {
      const user = userEvent.setup();
      (window.confirm as ReturnType<typeof vi.fn>).mockReturnValue(true);

      useDiffStore.setState({
        isSettingsModalOpen: true,
        theme: 'dark',
        defaultOptions: {
          ignoreWhitespace: false,
          normalizeEOL: true,
          viewMode: 'side-by-side',
          compactMode: false,
          wordWrap: false,
          tabSize: 4,
          fontSize: 24,
          insertSpaces: true,
          diffAlgorithm: 'advanced',
          hideUnchangedRegions: false,
          renderWhitespace: 'all',
          renderControlCharacters: true,
          unicodeHighlight: {
            invisibleCharacters: true,
            ambiguousCharacters: true,
            nonBasicASCII: false,
            includeComments: true,
            includeStrings: true,
          },
        },
      });

      render(<SettingsModal />);

      // リセットボタンをクリック
      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      // キャンセルボタンをクリック
      const cancelButton = screen.getByText('キャンセル');
      await user.click(cancelButton);

      // settings.setは呼ばれていない
      expect(mockElectronAPI.settings.set).not.toHaveBeenCalled();

      // モーダルが閉じている
      const state = useDiffStore.getState();
      expect(state.isSettingsModalOpen).toBe(false);

      // ストアの設定は変更されていない
      expect(state.theme).toBe('dark');
      expect(state.defaultOptions.fontSize).toBe(24);
    });
  });

  describe('Update check functionality', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should display checking message when checking for updates', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      // Mock checkForUpdates to be a long-running operation
      mockElectronAPI.updater.checkForUpdates.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<SettingsModal />);

      // Wait for the button to appear
      const checkButton = await screen.findByText('今すぐ更新を確認');
      await user.click(checkButton);

      // Should display checking message
      await waitFor(() => {
        expect(screen.getByText('更新を確認中...')).toBeTruthy();
      });

      // Button should be disabled while checking
      const button = checkButton as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should display last update check time from localStorage', async () => {
      const lastCheckTime = '2025/10/23 22:00';
      localStorage.setItem('lastUpdateCheck', lastCheckTime);

      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      await waitFor(() => {
        expect(screen.getByText(`最終確認: ${lastCheckTime}`)).toBeTruthy();
      });
    });

    it('should update last check time after checking for updates', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      // Mock onUpdateNotAvailable to trigger the callback
      mockElectronAPI.updater.onUpdateNotAvailable.mockImplementation((callback) => {
        // Simulate update not available event (version is arbitrary for this test)
        setTimeout(() => callback({ version: '1.0.0' }), 100);
      });

      render(<SettingsModal />);

      const checkButton = await screen.findByText('今すぐ更新を確認');
      await user.click(checkButton);

      // Wait for success message
      await waitFor(
        () => {
          expect(screen.getByText('最新バージョンです')).toBeTruthy();
        },
        { timeout: 3000 }
      );

      // Check that localStorage was updated with a timestamp
      const savedTime = localStorage.getItem('lastUpdateCheck');
      expect(savedTime).toBeTruthy();
      expect(savedTime).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/);
    });

    it('should display error message when update check fails', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      // Mock checkForUpdates to throw an error
      mockElectronAPI.updater.checkForUpdates.mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SettingsModal />);

      // Wait for the button to appear
      const checkButton = await screen.findByText('今すぐ更新を確認');
      await user.click(checkButton);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('更新チェックに失敗しました')).toBeTruthy();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should clear success message after 3 seconds', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      let updateCallback: ((info: { version: string }) => void) | null = null;

      // Mock onUpdateNotAvailable to save the callback
      mockElectronAPI.updater.onUpdateNotAvailable.mockImplementation((callback) => {
        updateCallback = callback;
      });

      render(<SettingsModal />);

      // Wait for the button to appear
      const checkButton = await screen.findByText('今すぐ更新を確認');
      await user.click(checkButton);

      // Trigger the update not available event
      await act(async () => {
        updateCallback?.({ version: '1.0.0' });
      });

      // Wait for success message
      await waitFor(
        () => {
          expect(screen.getByText('最新バージョンです')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      // Wait for message to be cleared (after 3 more seconds)
      await waitFor(
        () => {
          expect(screen.queryByText('最新バージョンです')).toBeNull();
        },
        { timeout: 4000 }
      );
    }, 10000);

    it('should clear error message after 3 seconds', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      // Mock checkForUpdates to throw an error
      mockElectronAPI.updater.checkForUpdates.mockRejectedValueOnce(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SettingsModal />);

      // Wait for the button to appear
      const checkButton = await screen.findByText('今すぐ更新を確認');
      await user.click(checkButton);

      // Wait for error message
      await waitFor(
        () => {
          expect(screen.getByText('更新チェックに失敗しました')).toBeTruthy();
        },
        { timeout: 2000 }
      );

      // Wait for message to be cleared (after 3 seconds)
      await waitFor(
        () => {
          expect(screen.queryByText('更新チェックに失敗しました')).toBeNull();
        },
        { timeout: 4000 }
      );

      consoleErrorSpy.mockRestore();
    }, 10000);
  });

  describe('Category navigation', () => {
    it('should display general category by default', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      await waitFor(() => {
        // 一般カテゴリがアクティブ
        const generalButton = screen.getByRole('button', { name: '一般' });
        expect(generalButton.classList.contains('active')).toBe(true);

        // テーマ設定が表示されている（一般カテゴリの内容）
        expect(screen.getByText('テーマ')).toBeTruthy();
      });
    });

    it('should switch to defaults category when clicked', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });
      await user.click(defaultsButton);

      await waitFor(() => {
        // デフォルト設定カテゴリがアクティブ
        expect(defaultsButton.classList.contains('active')).toBe(true);

        // エディター設定セクションが表示されている
        expect(screen.getByText('エディター設定')).toBeTruthy();
        expect(screen.getByText('差分設定')).toBeTruthy();
      });
    });

    it('should display developer category in development mode', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true, devMode: true });
      render(<SettingsModal />);

      await waitFor(() => {
        // 開発環境なので開発者向けカテゴリが表示される
        expect(screen.getByRole('button', { name: '開発者向け' })).toBeTruthy();
      });
    });

    it('should switch to developer category when clicked', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true, devMode: true });
      render(<SettingsModal />);

      const developerButton = screen.getByRole('button', { name: '開発者向け' });
      await user.click(developerButton);

      await waitFor(() => {
        // 開発者向けカテゴリがアクティブ
        expect(developerButton.classList.contains('active')).toBe(true);

        // 開発者向け設定が表示されている
        expect(screen.getByText('開発者向け設定')).toBeTruthy();
        expect(screen.getByText('開発環境でのみ利用可能な設定です。')).toBeTruthy();
      });
    });

    it('should navigate categories with arrow keys', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      const generalButton = screen.getByRole('button', { name: '一般' });
      const defaultsButton = screen.getByRole('button', { name: 'デフォルト設定' });

      // 一般カテゴリをクリックしてフォーカスを当てる
      await user.click(generalButton);

      // ArrowDownで次のカテゴリへ
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(defaultsButton.classList.contains('active')).toBe(true);
      });

      // defaultsButtonをクリックしてフォーカスを確保
      await user.click(defaultsButton);

      // ArrowUpで前のカテゴリへ
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(generalButton.classList.contains('active')).toBe(true);
      });
    });

    it('should wrap around when navigating with arrow keys', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true, devMode: true });
      render(<SettingsModal />);

      const generalButton = screen.getByRole('button', { name: '一般' });
      const developerButton = screen.getByRole('button', { name: '開発者向け' });

      // 開発者向けカテゴリをクリックしてフォーカスを当てる
      await user.click(developerButton);

      // ArrowDownで最初のカテゴリへ戻る（循環）
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(generalButton.classList.contains('active')).toBe(true);
      });

      // generalButtonをクリックしてフォーカスを確保
      await user.click(generalButton);

      // ArrowUpで最後のカテゴリへ戻る（循環）
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(developerButton.classList.contains('active')).toBe(true);
      });
    });
  });

  describe('Accent Color', () => {
    it('should display accent color select', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      const accentColorLabel = screen.getByText('アクセントカラー');
      const accentColorSection = accentColorLabel.closest('.settings-section') as HTMLElement;
      const accentColorSelect = accentColorSection.querySelector('select') as HTMLSelectElement;

      expect(accentColorSelect).toBeTruthy();
      expect(accentColorSelect.value).toBe('blue');
    });

    it('should have blue and green options', async () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      const accentColorLabel = screen.getByText('アクセントカラー');
      const accentColorSection = accentColorLabel.closest('.settings-section') as HTMLElement;
      const accentColorSelect = accentColorSection.querySelector('select') as HTMLSelectElement;

      const options = Array.from(accentColorSelect.querySelectorAll('option')).map(
        (opt) => opt.textContent
      );

      expect(options).toContain('青 (デフォルト値)');
      expect(options).toContain('緑');
    });

    it('should change accent color immediately on selection (preview)', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true, accentColor: 'blue' });
      const setAccentColor = vi.fn();
      useDiffStore.setState({ setAccentColor });

      render(<SettingsModal />);

      const accentColorLabel = screen.getByText('アクセントカラー');
      const accentColorSection = accentColorLabel.closest('.settings-section') as HTMLElement;
      const accentColorSelect = accentColorSection.querySelector('select') as HTMLSelectElement;

      // 緑に変更
      await user.selectOptions(accentColorSelect, 'green');

      // setAccentColorが即座に呼ばれることを確認（プレビュー）
      expect(setAccentColor).toHaveBeenCalledWith('green');
    });

    it('should revert to initial accent color on cancel', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true, accentColor: 'blue' });
      const setAccentColor = vi.fn();
      useDiffStore.setState({ setAccentColor });

      render(<SettingsModal />);

      const accentColorLabel = screen.getByText('アクセントカラー');
      const accentColorSection = accentColorLabel.closest('.settings-section') as HTMLElement;
      const accentColorSelect = accentColorSection.querySelector('select') as HTMLSelectElement;

      // 緑に変更（プレビュー）
      await user.selectOptions(accentColorSelect, 'green');
      expect(setAccentColor).toHaveBeenCalledWith('green');

      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      // 初期値（blue）に戻ることを確認
      expect(setAccentColor).toHaveBeenCalledWith('blue');
    });

    it('should include accent color in saved settings', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true, accentColor: 'blue' });

      render(<SettingsModal />);

      const accentColorLabel = screen.getByText('アクセントカラー');
      const accentColorSection = accentColorLabel.closest('.settings-section') as HTMLElement;
      const accentColorSelect = accentColorSection.querySelector('select') as HTMLSelectElement;

      // 緑に変更
      await user.selectOptions(accentColorSelect, 'green');

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '保存' });
      await user.click(saveButton);

      // settings.setが呼ばれることを確認
      await waitFor(() => {
        expect(mockElectronAPI.settings.set).toHaveBeenCalledWith(
          expect.objectContaining({
            accentColor: 'green',
          })
        );
      });
    });

    it('should reset accent color to default (blue) on reset', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true, accentColor: 'green' });

      // confirmをモック
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<SettingsModal />);

      const accentColorLabel = screen.getByText('アクセントカラー');
      const accentColorSection = accentColorLabel.closest('.settings-section') as HTMLElement;
      const accentColorSelect = accentColorSection.querySelector('select') as HTMLSelectElement;

      // 現在緑になっているはず
      expect(accentColorSelect.value).toBe('green');

      // リセットボタンをクリック
      const resetButton = screen.getByRole('button', { name: 'デフォルトにリセット' });
      await user.click(resetButton);

      // アクセントカラーがblue（デフォルト）に戻ることを確認
      await waitFor(() => {
        expect(accentColorSelect.value).toBe('blue');
      });

      confirmSpy.mockRestore();
    });
  });
});
