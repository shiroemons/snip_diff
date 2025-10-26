import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDiffStore } from '../stores/diffStore';
import Footer from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDiffStore.setState({
      sessions: [],
      activeSessionId: null,
      theme: 'auto',
    });
  });

  describe('Rendering', () => {
    it('should return null when no active session', () => {
      const { container } = render(<Footer />);
      expect(container.firstChild).toBeNull();
    });

    it('should render stats when available', () => {
      const { initializeSession, updateStats } = useDiffStore.getState();
      initializeSession();
      updateStats({ adds: 5, dels: 3, hunks: 2, leftLines: 10, rightLines: 12 });

      render(<Footer />);

      expect(screen.getByText('+5')).toBeTruthy();
      expect(screen.getByText('-3')).toBeTruthy();
      expect(screen.getByText('2 hunks')).toBeTruthy();
    });

    it('should not render stats when not available', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      expect(screen.queryByText(/hunks/)).toBeNull();
    });

    it('should render all control selects', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      expect(screen.getByTitle('フォントサイズ')).toBeTruthy();
      expect(screen.getByTitle('空白文字の表示（スペースやタブを可視化）')).toBeTruthy();
      expect(screen.getByTitle('インデント方式')).toBeTruthy();
      expect(screen.getByTitle('インデントサイズ')).toBeTruthy();
      expect(screen.getByTitle('Beforeの改行コード')).toBeTruthy();
      expect(screen.getByTitle('Afterの改行コード')).toBeTruthy();
      expect(screen.getByTitle('言語モード')).toBeTruthy();
    });
  });

  describe('Font size selection', () => {
    it('should display current font size', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ fontSize: 18 });

      render(<Footer />);

      const fontSizeSelect = screen.getByTitle('フォントサイズ') as HTMLSelectElement;
      expect(fontSizeSelect.value).toBe('18');
    });

    it('should change font size when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const fontSizeSelect = screen.getByTitle('フォントサイズ');
      await user.selectOptions(fontSizeSelect, '20');

      const session = getActiveSession();
      expect(session?.options.fontSize).toBe(20);
    });

    it('should support maximum font size of 36', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const fontSizeSelect = screen.getByTitle('フォントサイズ');
      await user.selectOptions(fontSizeSelect, '36');

      const session = getActiveSession();
      expect(session?.options.fontSize).toBe(36);
    });
  });

  describe('Indent selection', () => {
    it('should display spaces when insertSpaces is true', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ insertSpaces: true });

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式') as HTMLSelectElement;
      expect(indentSelect.value).toBe('スペース');
    });

    it('should display tabs when insertSpaces is false', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ insertSpaces: false });

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式') as HTMLSelectElement;
      expect(indentSelect.value).toBe('タブ');
    });

    it('should change to spaces when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式');
      await user.selectOptions(indentSelect, 'スペース');

      const session = getActiveSession();
      expect(session?.options.insertSpaces).toBe(true);
    });

    it('should change to tabs when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式');
      await user.selectOptions(indentSelect, 'タブ');

      const session = getActiveSession();
      expect(session?.options.insertSpaces).toBe(false);
    });
  });

  describe('Indent size selection', () => {
    it('should display current indent size', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ tabSize: 4 });

      render(<Footer />);

      const indentSizeSelect = screen.getByTitle('インデントサイズ') as HTMLSelectElement;
      expect(indentSizeSelect.value).toBe('4');
    });

    it('should change indent size when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const indentSizeSelect = screen.getByTitle('インデントサイズ');
      await user.selectOptions(indentSizeSelect, '8');

      const session = getActiveSession();
      expect(session?.options.tabSize).toBe(8);
    });
  });

  describe('EOL selection', () => {
    it('should display current left EOL', () => {
      const { initializeSession, updateLeftBuffer } = useDiffStore.getState();
      initializeSession();
      updateLeftBuffer('line1\r\nline2');

      render(<Footer />);

      const leftEOLSelect = screen.getByTitle('Beforeの改行コード') as HTMLSelectElement;
      expect(leftEOLSelect.value).toBe('CRLF');
    });

    it('should display current right EOL', () => {
      const { initializeSession, updateRightBuffer } = useDiffStore.getState();
      initializeSession();
      updateRightBuffer('line1\nline2');

      render(<Footer />);

      const rightEOLSelect = screen.getByTitle('Afterの改行コード') as HTMLSelectElement;
      expect(rightEOLSelect.value).toBe('LF');
    });

    it('should change left EOL when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const leftEOLSelect = screen.getByTitle('Beforeの改行コード');
      await user.selectOptions(leftEOLSelect, 'CRLF');

      const session = getActiveSession();
      expect(session?.left.eol).toBe('CRLF');
    });

    it('should change right EOL when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const rightEOLSelect = screen.getByTitle('Afterの改行コード');
      await user.selectOptions(rightEOLSelect, 'LF');

      const session = getActiveSession();
      expect(session?.right.eol).toBe('LF');
    });
  });

  describe('Language selection', () => {
    it('should display current language', () => {
      const { initializeSession, updateBuffersLang } = useDiffStore.getState();
      initializeSession();
      updateBuffersLang('typescript');

      render(<Footer />);

      const langSelect = screen.getByTitle('言語モード') as HTMLSelectElement;
      expect(langSelect.value).toBe('typescript');
    });

    it('should default to plaintext', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const langSelect = screen.getByTitle('言語モード') as HTMLSelectElement;
      expect(langSelect.value).toBe('plaintext');
    });

    it('should change language when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const langSelect = screen.getByTitle('言語モード');
      await user.selectOptions(langSelect, 'javascript');

      const session = getActiveSession();
      expect(session?.left.lang).toBe('javascript');
      expect(session?.right.lang).toBe('javascript');
    });

    it('should have all supported languages', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const langSelect = screen.getByTitle('言語モード') as HTMLSelectElement;
      const options = Array.from(langSelect.options).map((opt) => opt.value);

      // Check for some key languages
      expect(options).toContain('plaintext');
      expect(options).toContain('javascript');
      expect(options).toContain('typescript');
      expect(options).toContain('python');
      expect(options).toContain('go');
      expect(options).toContain('rust');
    });
  });

  describe('Render whitespace selection', () => {
    it('should display current renderWhitespace value', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ renderWhitespace: 'all' });

      render(<Footer />);

      const renderWhitespaceSelect = screen.getByTitle(
        '空白文字の表示（スペースやタブを可視化）'
      ) as HTMLSelectElement;
      expect(renderWhitespaceSelect.value).toBe('all');
    });

    it('should default to all', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const renderWhitespaceSelect = screen.getByTitle(
        '空白文字の表示（スペースやタブを可視化）'
      ) as HTMLSelectElement;
      expect(renderWhitespaceSelect.value).toBe('all');
    });

    it('should change renderWhitespace when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const renderWhitespaceSelect = screen.getByTitle('空白文字の表示（スペースやタブを可視化）');
      await user.selectOptions(renderWhitespaceSelect, 'trailing');

      const session = getActiveSession();
      expect(session?.options.renderWhitespace).toBe('trailing');
    });

    it('should support all renderWhitespace options', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const renderWhitespaceSelect = screen.getByTitle(
        '空白文字の表示（スペースやタブを可視化）'
      ) as HTMLSelectElement;
      const options = Array.from(renderWhitespaceSelect.options).map((opt) => opt.value);

      expect(options).toContain('none');
      expect(options).toContain('boundary');
      expect(options).toContain('selection');
      expect(options).toContain('trailing');
      expect(options).toContain('all');
    });
  });

  describe('Stats display', () => {
    it('should show correct stat classes', () => {
      const { initializeSession, updateStats } = useDiffStore.getState();
      initializeSession();
      updateStats({ adds: 10, dels: 5, hunks: 1, leftLines: 100, rightLines: 105 });

      render(<Footer />);

      const addsStat = screen.getByText('+10');
      const delsStat = screen.getByText('-5');

      expect(addsStat.className).toContain('stat-add');
      expect(delsStat.className).toContain('stat-del');
    });

    it('should display zero stats correctly', () => {
      const { initializeSession, updateStats } = useDiffStore.getState();
      initializeSession();
      updateStats({ adds: 0, dels: 0, hunks: 0, leftLines: 0, rightLines: 0 });

      render(<Footer />);

      expect(screen.getByText('+0')).toBeTruthy();
      expect(screen.getByText('-0')).toBeTruthy();
      expect(screen.getByText('0 hunks')).toBeTruthy();
    });
  });

  describe('Development mode indicator', () => {
    it('should not display DEV indicator in test environment', () => {
      render(<Footer />);

      // In test environment, import.meta.env.DEV is false
      // So DEV indicator should not be present
      const devIndicator = screen.queryByText('DEV');
      expect(devIndicator).toBeNull();
    });
  });
});
