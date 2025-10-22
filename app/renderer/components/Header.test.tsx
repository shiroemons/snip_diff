import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDiffStore } from '../stores/diffStore';
import Header from './Header';

describe('Header', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDiffStore.setState({
      sessions: [],
      activeSessionId: null,
      theme: 'auto',
    });
  });

  describe('Rendering', () => {
    it('should render app title', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      expect(screen.getByText('SnipDiff')).toBeTruthy();
    });

    it('should render version with "v" prefix', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      // __APP_VERSION__はvite.config.mtsで定義される
      const versionElement = screen.getByText(/^v\d{4}\.\d{1,2}\.\d+$/);
      expect(versionElement).toBeTruthy();
      expect(versionElement.className).toContain('app-version');
    });

    it('should render all control buttons', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      expect(screen.getByTitle('空白を無視')).toBeTruthy();
      expect(screen.getByTitle('折り返し')).toBeTruthy();
      expect(screen.getByTitle(/左右を入れ替え/)).toBeTruthy();
      expect(screen.getByTitle(/クリア/)).toBeTruthy();
    });
  });

  describe('Option toggles', () => {
    it('should toggle ignoreWhitespace option', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      const ignoreWhitespaceButton = screen.getByTitle('空白を無視');
      await user.click(ignoreWhitespaceButton);

      const session = getActiveSession();
      expect(session?.options.ignoreWhitespace).toBe(true);
    });

    it('should toggle wordWrap option', async () => {
      const user = userEvent.setup();
      const { initializeSession, getActiveSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      const wordWrapButton = screen.getByTitle('折り返し');
      await user.click(wordWrapButton);

      const session = getActiveSession();
      expect(session?.options.wordWrap).toBe(true);
    });

    it('should toggle normalizeEOL option when button exists', () => {
      const { initializeSession, updateOptions, getActiveSession } = useDiffStore.getState();
      initializeSession();

      // Manually test the option toggle logic
      const initialNormalizeEOL = getActiveSession()?.options.normalizeEOL ?? false;
      updateOptions({ normalizeEOL: !initialNormalizeEOL });

      const session = getActiveSession();
      expect(session?.options.normalizeEOL).toBe(!initialNormalizeEOL);
    });

    it('should add active class when ignoreWhitespace is enabled', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ ignoreWhitespace: true });

      render(<Header />);

      const button = screen.getByTitle('空白を無視');
      expect(button.className).toContain('active');
    });

    it('should add active class when wordWrap is enabled', () => {
      const { initializeSession, updateOptions } = useDiffStore.getState();
      initializeSession();
      updateOptions({ wordWrap: true });

      render(<Header />);

      const button = screen.getByTitle('折り返し');
      expect(button.className).toContain('active');
    });

    it('should not have active class when options are disabled', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      const ignoreWhitespaceButton = screen.getByTitle('空白を無視');
      const wordWrapButton = screen.getByTitle('折り返し');

      expect(ignoreWhitespaceButton.className).not.toContain('active');
      expect(wordWrapButton.className).not.toContain('active');
    });
  });

  describe('Action buttons', () => {
    it('should call onSwap when swap button is clicked', async () => {
      const user = userEvent.setup();
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      const onSwap = vi.fn();
      render(<Header onSwap={onSwap} />);

      const swapButton = screen.getByTitle(/左右を入れ替え/);
      await user.click(swapButton);

      expect(onSwap).toHaveBeenCalledTimes(1);
    });

    it('should call onClear when clear button is clicked', async () => {
      const user = userEvent.setup();
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      const onClear = vi.fn();
      render(<Header onClear={onClear} />);

      const clearButton = screen.getByTitle(/クリア/);
      await user.click(clearButton);

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Theme menu', () => {
    it('should display theme toggle button', () => {
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      const themeButton = screen.getByRole('button', { name: /テーマメニュー/ });
      expect(themeButton).toBeTruthy();
    });

    it('should open theme menu when clicking toggle button', async () => {
      const user = userEvent.setup();
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      const themeButton = screen.getByRole('button', { name: /テーマメニュー/ });
      await user.click(themeButton);

      expect(screen.getByText('ライトテーマ')).toBeTruthy();
      expect(screen.getByText('ダークテーマ')).toBeTruthy();
      expect(screen.getByText('システムテーマ')).toBeTruthy();
    });

    it('should change theme when selecting from menu', async () => {
      const user = userEvent.setup();
      const { initializeSession, setTheme } = useDiffStore.getState();
      initializeSession();
      setTheme('auto');

      render(<Header />);

      const themeButton = screen.getByRole('button', { name: /テーマメニュー/ });
      await user.click(themeButton);

      const lightThemeOption = screen.getByText('ライトテーマ');
      await user.click(lightThemeOption);

      const state = useDiffStore.getState();
      expect(state.theme).toBe('light');
    });

    it('should close menu after selecting theme', async () => {
      const user = userEvent.setup();
      const { initializeSession } = useDiffStore.getState();
      initializeSession();

      render(<Header />);

      const themeButton = screen.getByRole('button', { name: /テーマメニュー/ });
      await user.click(themeButton);

      const darkThemeOption = screen.getByText('ダークテーマ');
      await user.click(darkThemeOption);

      expect(screen.queryByText('ライトテーマ')).toBeNull();
    });
  });

  describe('No active session', () => {
    it('should render when no active session exists', () => {
      render(<Header />);

      expect(screen.getByText('SnipDiff')).toBeTruthy();
    });

    it('should not toggle options when no active session exists', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const ignoreWhitespaceButton = screen.getByTitle('空白を無視');
      await user.click(ignoreWhitespaceButton);

      // No error should be thrown and no session should be created
      const { getActiveSession } = useDiffStore.getState();
      expect(getActiveSession()).toBeUndefined();
    });

    it('should not have active class on buttons when no session', () => {
      render(<Header />);

      const ignoreWhitespaceButton = screen.getByTitle('空白を無視');
      const wordWrapButton = screen.getByTitle('折り返し');

      expect(ignoreWhitespaceButton.className).not.toContain('active');
      expect(wordWrapButton.className).not.toContain('active');
    });
  });
});
