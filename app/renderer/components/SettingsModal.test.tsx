import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import SettingsModal from './SettingsModal';
import { useDiffStore } from '../stores/diffStore';

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
      expect(screen.getByText(/ここで設定した値が、アプリケーション起動時や新しく比較を開始する際のデフォルト値として使用されます/)).toBeTruthy();
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

      const expectedSizes = ['10', '12', '14', '16', '18', '20', '22', '24', '26', '28', '30', '32', '34', '36'];
      const options = Array.from(fontSizeSelect.options).map(opt => opt.value);

      expectedSizes.forEach(size => {
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
      expect(screen.getByText(/Side by Side.*左右並べて表示.*またはUnified.*統合表示/)).toBeTruthy();
    });

    it('should display compact mode description', () => {
      render(<SettingsModal />);
      expect(screen.getByText('行レベルの背景色を削除し、実際に変更された文字だけを精密にハイライト表示します。')).toBeTruthy();
    });

    it('should display indent method description', () => {
      render(<SettingsModal />);
      expect(screen.getByText(/Tabキーを押したときにスペースまたはタブ文字のどちらを挿入するか/)).toBeTruthy();
    });

    it('should display indent size description', () => {
      render(<SettingsModal />);
      expect(screen.getByText(/インデント1つあたりのスペース数、またはタブ文字の表示幅/)).toBeTruthy();
    });

    it('should display EOL description', () => {
      render(<SettingsModal />);
      expect(screen.getByText(/新規入力時の改行コード.*LF: Unix\/Mac.*CRLF: Windows.*Auto: OSに従う/)).toBeTruthy();
    });

    it('should display language mode description', () => {
      render(<SettingsModal />);
      expect(screen.getByText(/シンタックスハイライトに使用する言語.*コードの構文に応じた色分け/)).toBeTruthy();
    });
  });
});
