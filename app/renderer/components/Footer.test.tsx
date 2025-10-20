import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import Footer from './Footer';
import { useDiffStore } from '../stores/diffStore';

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

      expect(screen.getByTitle('テーマ')).toBeTruthy();
      expect(screen.getByTitle('フォントサイズ')).toBeTruthy();
      expect(screen.getByTitle('インデント方式')).toBeTruthy();
      expect(screen.getByTitle('タブサイズ')).toBeTruthy();
      expect(screen.getByTitle('Beforeの改行コード')).toBeTruthy();
      expect(screen.getByTitle('Afterの改行コード')).toBeTruthy();
      expect(screen.getByTitle('シンタックスハイライトの言語')).toBeTruthy();
    });
  });

  describe('Theme selection', () => {
    it('should display current theme', () => {
      const { initializeSession, setTheme } = useDiffStore.getState();
      initializeSession();
      setTheme('dark');

      render(<Footer />);

      const themeSelect = screen.getByTitle('テーマ') as HTMLSelectElement;
      expect(themeSelect.value).toBe('dark');
    });

    it('should change theme when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const themeSelect = screen.getByTitle('テーマ');
      await user.selectOptions(themeSelect, 'light');

      const state = useDiffStore.getState();
      expect(state.theme).toBe('light');
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
  });

  describe('Indent selection', () => {
    it('should display spaces when insertSpaces is true', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ insertSpaces: true });

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式') as HTMLSelectElement;
      expect(indentSelect.value).toBe('spaces');
    });

    it('should display tabs when insertSpaces is false', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ insertSpaces: false });

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式') as HTMLSelectElement;
      expect(indentSelect.value).toBe('tabs');
    });

    it('should change to spaces when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式');
      await user.selectOptions(indentSelect, 'spaces');

      const session = getActiveSession();
      expect(session?.options.insertSpaces).toBe(true);
    });

    it('should change to tabs when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const indentSelect = screen.getByTitle('インデント方式');
      await user.selectOptions(indentSelect, 'tabs');

      const session = getActiveSession();
      expect(session?.options.insertSpaces).toBe(false);
    });
  });

  describe('Tab size selection', () => {
    it('should display current tab size', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ tabSize: 4 });

      render(<Footer />);

      const tabSizeSelect = screen.getByTitle('タブサイズ') as HTMLSelectElement;
      expect(tabSizeSelect.value).toBe('4');
    });

    it('should change tab size when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const tabSizeSelect = screen.getByTitle('タブサイズ');
      await user.selectOptions(tabSizeSelect, '8');

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

      const langSelect = screen.getByTitle('シンタックスハイライトの言語') as HTMLSelectElement;
      expect(langSelect.value).toBe('typescript');
    });

    it('should default to plaintext', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const langSelect = screen.getByTitle('シンタックスハイライトの言語') as HTMLSelectElement;
      expect(langSelect.value).toBe('plaintext');
    });

    it('should change language when selected', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const langSelect = screen.getByTitle('シンタックスハイライトの言語');
      await user.selectOptions(langSelect, 'javascript');

      const session = getActiveSession();
      expect(session?.left.lang).toBe('javascript');
      expect(session?.right.lang).toBe('javascript');
    });

    it('should have all supported languages', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Footer />);

      const langSelect = screen.getByTitle('シンタックスハイライトの言語') as HTMLSelectElement;
      const options = Array.from(langSelect.options).map(opt => opt.value);

      // Check for some key languages
      expect(options).toContain('plaintext');
      expect(options).toContain('javascript');
      expect(options).toContain('typescript');
      expect(options).toContain('python');
      expect(options).toContain('go');
      expect(options).toContain('rust');
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
});
