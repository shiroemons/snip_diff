import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiffStore } from '../../../stores/diffStore';
import { useDiffStore } from '../../../stores/diffStore';
import { ComparisonPanel } from './ComparisonPanel';
import type { editor } from 'monaco-editor';

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  DiffEditor: ({
    onMount,
    theme,
    options,
  }: {
    onMount: (editor: unknown) => void;
    theme: string;
    options: editor.IDiffEditorConstructionOptions;
  }) => {
    const mockEditor = { theme, options } as unknown as editor.IStandaloneDiffEditor;
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0);
    }
    return (
      <div
        data-testid="monaco-diff-editor"
        data-theme={theme}
        data-options={JSON.stringify(options)}
      />
    );
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  Maximize2: () => <span>Maximize2</span>,
  Minimize2: () => <span>Minimize2</span>,
}));

// Mock useDiffStore
vi.mock('../../../stores/diffStore', () => ({
  useDiffStore: {
    getState: vi.fn(() => ({
      updateOptions: vi.fn(),
    })),
  },
}));

describe('ComparisonPanel', () => {
  const defaultProps = {
    leftContent: 'original content',
    rightContent: 'modified content',
    language: 'typescript',
    themeName: 'vs',
    panelHeight: 400,
    isFullscreen: false,
    isMinimized: false,
    isResizing: false,
    isWindowMaximized: false,
    compactMode: false,
    viewMode: 'side-by-side' as 'unified' | 'side-by-side',
    ignoreWhitespace: false,
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    hideUnchangedRegions: false,
    renderWhitespace: 'none' as 'none' | 'boundary' | 'selection' | 'trailing' | 'all',
    onDiffEditorMount: vi.fn(),
    onToggleFullscreen: vi.fn(),
    onToggleMinimize: vi.fn(),
    onResizeMouseDown: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with header title', () => {
    render(<ComparisonPanel {...defaultProps} />);

    expect(screen.getByText('差分表示')).toBeTruthy();
  });

  it('should render DiffEditor component', () => {
    render(<ComparisonPanel {...defaultProps} />);

    expect(screen.getByTestId('monaco-diff-editor')).toBeTruthy();
  });

  it('should call onDiffEditorMount when editor is mounted', async () => {
    const onDiffEditorMount = vi.fn();
    render(<ComparisonPanel {...defaultProps} onDiffEditorMount={onDiffEditorMount} />);

    await vi.waitFor(() => {
      expect(onDiffEditorMount).toHaveBeenCalledTimes(1);
    });
  });

  it('should render view mode toggle buttons', () => {
    render(<ComparisonPanel {...defaultProps} />);

    expect(screen.getByText('Unified')).toBeTruthy();
    expect(screen.getByText('Side by Side')).toBeTruthy();
  });

  it('should render Compact mode checkbox', () => {
    render(<ComparisonPanel {...defaultProps} />);

    expect(screen.getByText('Compact')).toBeTruthy();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeTruthy();
  });

  it('should call updateOptions when Unified button is clicked', async () => {
    const user = userEvent.setup();
    const mockUpdateOptions = vi.fn();
    vi.mocked(useDiffStore.getState).mockReturnValue({
      updateOptions: mockUpdateOptions,
    } as Partial<DiffStore> as DiffStore);

    render(<ComparisonPanel {...defaultProps} viewMode="side-by-side" />);

    const unifiedButton = screen.getByText('Unified');
    await user.click(unifiedButton);

    expect(mockUpdateOptions).toHaveBeenCalledWith({ viewMode: 'unified' });
  });

  it('should call updateOptions when Side by Side button is clicked', async () => {
    const user = userEvent.setup();
    const mockUpdateOptions = vi.fn();
    vi.mocked(useDiffStore.getState).mockReturnValue({
      updateOptions: mockUpdateOptions,
    } as Partial<DiffStore> as DiffStore);

    render(<ComparisonPanel {...defaultProps} viewMode="unified" />);

    const sideBySideButton = screen.getByText('Side by Side');
    await user.click(sideBySideButton);

    expect(mockUpdateOptions).toHaveBeenCalledWith({ viewMode: 'side-by-side' });
  });

  it('should call updateOptions when Compact mode checkbox is toggled', async () => {
    const user = userEvent.setup();
    const mockUpdateOptions = vi.fn();
    vi.mocked(useDiffStore.getState).mockReturnValue({
      updateOptions: mockUpdateOptions,
    } as Partial<DiffStore> as DiffStore);

    render(<ComparisonPanel {...defaultProps} compactMode={false} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockUpdateOptions).toHaveBeenCalledWith({ compactMode: true });
  });

  it('should call onToggleMinimize when minimize button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleMinimize = vi.fn();
    render(<ComparisonPanel {...defaultProps} onToggleMinimize={onToggleMinimize} />);

    const minimizeButton = screen.getByTitle('パネルを最小化');
    await user.click(minimizeButton);

    expect(onToggleMinimize).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleFullscreen when fullscreen button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleFullscreen = vi.fn();
    render(<ComparisonPanel {...defaultProps} onToggleFullscreen={onToggleFullscreen} />);

    const fullscreenButton = screen.getByTitle('全画面表示');
    await user.click(fullscreenButton);

    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('should show restore title when panel is minimized', () => {
    render(<ComparisonPanel {...defaultProps} isMinimized={true} />);

    expect(screen.getByTitle('パネルを復元')).toBeTruthy();
  });

  it('should show restore size title when panel is fullscreen', () => {
    render(<ComparisonPanel {...defaultProps} isFullscreen={true} />);

    expect(screen.getByTitle('元のサイズに戻す')).toBeTruthy();
  });

  it('should hide DiffEditor when panel is minimized', () => {
    render(<ComparisonPanel {...defaultProps} isMinimized={true} />);

    expect(screen.queryByTestId('monaco-diff-editor')).toBeNull();
  });

  it('should render resize handle when not fullscreen and not minimized', () => {
    const { container } = render(
      <ComparisonPanel {...defaultProps} isFullscreen={false} isMinimized={false} />
    );

    const resizeHandle = container.querySelector('.resize-handle');
    expect(resizeHandle).toBeTruthy();
  });

  it('should not render resize handle when fullscreen', () => {
    const { container } = render(
      <ComparisonPanel {...defaultProps} isFullscreen={true} isMinimized={false} />
    );

    const resizeHandle = container.querySelector('.resize-handle');
    expect(resizeHandle).toBeNull();
  });

  it('should not render resize handle when minimized', () => {
    const { container } = render(
      <ComparisonPanel {...defaultProps} isFullscreen={false} isMinimized={true} />
    );

    const resizeHandle = container.querySelector('.resize-handle');
    expect(resizeHandle).toBeNull();
  });

  it('should call onResizeMouseDown when resize handle is clicked', () => {
    const onResizeMouseDown = vi.fn();
    const { container } = render(
      <ComparisonPanel {...defaultProps} onResizeMouseDown={onResizeMouseDown} />
    );

    const resizeHandle = container.querySelector('.resize-handle') as HTMLElement;
    resizeHandle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onResizeMouseDown).toHaveBeenCalledTimes(1);
  });

  it('should apply fullscreen class when isFullscreen is true', () => {
    const { container } = render(<ComparisonPanel {...defaultProps} isFullscreen={true} />);

    const panel = container.querySelector('.compare-panel');
    expect(panel?.className).toContain('fullscreen');
  });

  it('should apply minimized class when isMinimized is true', () => {
    const { container } = render(<ComparisonPanel {...defaultProps} isMinimized={true} />);

    const panel = container.querySelector('.compare-panel');
    expect(panel?.className).toContain('minimized');
  });

  it('should apply resizing class when isResizing is true', () => {
    const { container } = render(<ComparisonPanel {...defaultProps} isResizing={true} />);

    const panel = container.querySelector('.compare-panel');
    expect(panel?.className).toContain('resizing');
  });

  it('should apply maximized class when isWindowMaximized is true', () => {
    const { container } = render(<ComparisonPanel {...defaultProps} isWindowMaximized={true} />);

    const panel = container.querySelector('.compare-panel');
    expect(panel?.className).toContain('maximized');
  });

  it('should apply panel height style', () => {
    const { container } = render(<ComparisonPanel {...defaultProps} panelHeight={500} />);

    const panel = container.querySelector('.compare-panel') as HTMLElement;
    expect(panel?.style.height).toBe('500px');
  });

  it('should apply 100% height when fullscreen', () => {
    const { container } = render(
      <ComparisonPanel {...defaultProps} isFullscreen={true} panelHeight={500} />
    );

    const panel = container.querySelector('.compare-panel') as HTMLElement;
    expect(panel?.style.height).toBe('100%');
  });

  it('should apply 40px height when minimized', () => {
    const { container } = render(
      <ComparisonPanel {...defaultProps} isMinimized={true} panelHeight={500} />
    );

    const panel = container.querySelector('.compare-panel') as HTMLElement;
    expect(panel?.style.height).toBe('40px');
  });

  it('should pass diff options to DiffEditor', () => {
    render(
      <ComparisonPanel
        {...defaultProps}
        viewMode="unified"
        ignoreWhitespace={true}
        fontSize={16}
        tabSize={4}
        insertSpaces={false}
      />
    );

    const diffEditor = screen.getByTestId('monaco-diff-editor');
    const options = JSON.parse(diffEditor.getAttribute('data-options') || '{}');

    expect(options.renderSideBySide).toBe(false);
    expect(options.ignoreTrimWhitespace).toBe(true);
    expect(options.fontSize).toBe(16);
    expect(options.tabSize).toBe(4);
    expect(options.insertSpaces).toBe(false);
  });

  it('should enable hideUnchangedRegions when compactMode is true', () => {
    render(<ComparisonPanel {...defaultProps} compactMode={true} />);

    const diffEditor = screen.getByTestId('monaco-diff-editor');
    const options = JSON.parse(diffEditor.getAttribute('data-options') || '{}');

    expect(options.hideUnchangedRegions).toBeTruthy();
    expect(options.hideUnchangedRegions.enabled).toBe(true);
  });

  it('should enable hideUnchangedRegions when hideUnchangedRegions prop is true', () => {
    render(<ComparisonPanel {...defaultProps} hideUnchangedRegions={true} compactMode={false} />);

    const diffEditor = screen.getByTestId('monaco-diff-editor');
    const options = JSON.parse(diffEditor.getAttribute('data-options') || '{}');

    expect(options.hideUnchangedRegions).toBeTruthy();
    expect(options.hideUnchangedRegions.enabled).toBe(true);
  });

  it('should add compact-mode class to content when compactMode is true', () => {
    const { container } = render(<ComparisonPanel {...defaultProps} compactMode={true} />);

    const content = container.querySelector('.compare-panel-content');
    expect(content?.className).toContain('compact-mode');
  });

  it('should mark active button for current view mode', () => {
    render(<ComparisonPanel {...defaultProps} viewMode="unified" />);

    const unifiedButton = screen.getByText('Unified');
    const sideBySideButton = screen.getByText('Side by Side');

    expect(unifiedButton.className).toContain('active');
    expect(sideBySideButton.className).not.toContain('active');
  });
});
