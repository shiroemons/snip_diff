import { render, screen } from '@testing-library/react';
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
      },
      defaultLanguage: 'plaintext',
      defaultEOL: 'auto',
    }),
    set: vi.fn().mockResolvedValue({ success: true }),
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

    it('should render when modal is open', () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);
      expect(screen.getByText('デフォルト設定')).toBeTruthy();
    });

    it('should display default settings intro text', () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);
      expect(
        screen.getByText(
          /ここで設定した値が、アプリケーション起動時や新しく比較を開始する際のデフォルト値として使用されます/
        )
      ).toBeTruthy();
    });
  });

  describe('Font size selection', () => {
    it('should display current font size', () => {
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
        },
      });

      render(<SettingsModal />);

      const fontSizeSelects = screen.getAllByDisplayValue('18');
      expect(fontSizeSelects.length).toBeGreaterThan(0);
    });

    it('should support maximum font size of 36', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      // フォントサイズのselect要素を取得（ラベルから探す）
      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSelect = fontSizeLabel.querySelector('select') as HTMLSelectElement;
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

    it('should have all font size options from 10 to 36', () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSelect = fontSizeLabel.querySelector('select') as HTMLSelectElement;

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

  describe('Theme selection', () => {
    it('should display current theme', () => {
      useDiffStore.setState({
        isSettingsModalOpen: true,
        theme: 'dark',
      });

      render(<SettingsModal />);

      const themeLabel = screen.getByText('テーマ');
      const themeSelect = themeLabel.querySelector('select') as HTMLSelectElement;
      expect(themeSelect.value).toBe('dark');
    });

    it('should change theme when selected', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const themeLabel = screen.getByText('テーマ');
      const themeSelect = themeLabel.querySelector('select') as HTMLSelectElement;

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

      const viewModeLabel = screen.getByText('比較の方式');
      const viewModeSelect = viewModeLabel.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(viewModeSelect, 'unified');
      expect(viewModeSelect.value).toBe('unified');
    });
  });

  describe('Language selection', () => {
    it('should change default language', async () => {
      const user = userEvent.setup();
      useDiffStore.setState({ isSettingsModalOpen: true });

      render(<SettingsModal />);

      const languageLabel = screen.getByText('デフォルト言語モード');
      const languageSelect = languageLabel.querySelector('select') as HTMLSelectElement;

      await user.selectOptions(languageSelect, 'javascript');
      expect(languageSelect.value).toBe('javascript');
    });
  });

  describe('Description texts', () => {
    beforeEach(() => {
      useDiffStore.setState({ isSettingsModalOpen: true });
    });

    it('should display theme description', () => {
      render(<SettingsModal />);
      expect(screen.getByText(/エディターの外観を変更します/)).toBeTruthy();
      expect(screen.getByText(/システムテーマ.*を選択すると、macOSの設定に従います/)).toBeTruthy();
    });

    it('should display font size description', () => {
      render(<SettingsModal />);
      expect(screen.getByText('エディターで表示されるテキストのサイズを変更します。')).toBeTruthy();
    });

    it('should display view mode description', () => {
      render(<SettingsModal />);
      expect(
        screen.getByText(/Side by Side.*左右並べて表示.*またはUnified.*統合表示/)
      ).toBeTruthy();
    });

    it('should display compact mode description', () => {
      render(<SettingsModal />);
      expect(
        screen.getByText(
          '行レベルの背景色を削除し、実際に変更された文字だけを精密にハイライト表示します。'
        )
      ).toBeTruthy();
    });

    it('should display indent method description', () => {
      render(<SettingsModal />);
      expect(
        screen.getByText(/Tabキーを押したときにスペースまたはタブ文字のどちらを挿入するか/)
      ).toBeTruthy();
    });

    it('should display indent size description', () => {
      render(<SettingsModal />);
      expect(
        screen.getByText(/インデント1つあたりのスペース数、またはタブ文字の表示幅/)
      ).toBeTruthy();
    });

    it('should display EOL description', () => {
      render(<SettingsModal />);
      expect(
        screen.getByText(/新規入力時の改行コード.*LF: Unix\/Mac.*CRLF: Windows.*Auto: OSに従う/)
      ).toBeTruthy();
    });

    it('should display language mode description', () => {
      render(<SettingsModal />);
      expect(
        screen.getByText(/シンタックスハイライトに使用する言語.*コードの構文に応じた色分け/)
      ).toBeTruthy();
    });
  });

  describe('Reset button', () => {
    beforeEach(() => {
      // Mock window.confirm
      vi.spyOn(window, 'confirm');
    });

    it('should render reset button', () => {
      useDiffStore.setState({ isSettingsModalOpen: true });
      render(<SettingsModal />);

      const resetButton = screen.getByText('デフォルトにリセット');
      expect(resetButton).toBeTruthy();
      expect(resetButton.getAttribute('title')).toBe('すべての設定をデフォルト値にリセットします');
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
        },
      });

      render(<SettingsModal />);

      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      // UI上のフォントサイズは変更されていないことを確認
      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSelect = fontSizeLabel.querySelector('select') as HTMLSelectElement;
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
        },
        defaultLanguage: 'javascript',
        defaultEOL: 'CRLF',
      });

      render(<SettingsModal />);

      const resetButton = screen.getByText('デフォルトにリセット');
      await user.click(resetButton);

      // UIがデフォルト値に更新されていることを確認
      const themeLabel = screen.getByText('テーマ');
      const themeSelect = themeLabel.querySelector('select') as HTMLSelectElement;
      expect(themeSelect.value).toBe('auto');

      const fontSizeLabel = screen.getByText('フォントサイズ');
      const fontSizeSelect = fontSizeLabel.querySelector('select') as HTMLSelectElement;
      expect(fontSizeSelect.value).toBe('14');

      const viewModeLabel = screen.getByText('比較の方式');
      const viewModeSelect = viewModeLabel.querySelector('select') as HTMLSelectElement;
      expect(viewModeSelect.value).toBe('side-by-side');

      const tabSizeLabel = screen.getByText('インデントサイズ');
      const tabSizeSelect = tabSizeLabel.querySelector('select') as HTMLSelectElement;
      expect(tabSizeSelect.value).toBe('4');

      const languageLabel = screen.getByText('デフォルト言語モード');
      const languageSelect = languageLabel.querySelector('select') as HTMLSelectElement;
      expect(languageSelect.value).toBe('plaintext');

      const eolLabel = screen.getByText('デフォルト改行コード');
      const eolSelect = eolLabel.querySelector('select') as HTMLSelectElement;
      expect(eolSelect.value).toBe('auto');
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
});
