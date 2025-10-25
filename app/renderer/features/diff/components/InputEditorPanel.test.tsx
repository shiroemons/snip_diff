import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InputEditorPanel } from './InputEditorPanel';
import type { editor } from 'monaco-editor';

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  Editor: ({
    onMount,
    theme,
  }: {
    onMount: (editor: unknown) => void;
    theme: string;
  }) => {
    const mockEditor = { theme } as unknown as editor.IStandaloneCodeEditor;
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0);
    }
    return <div data-testid="monaco-editor" data-theme={theme} />;
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Clipboard: () => <span>Clipboard</span>,
  Trash2: () => <span>Trash2</span>,
}));

describe('InputEditorPanel', () => {
  const defaultProps = {
    leftDefaultValue: 'left content',
    rightDefaultValue: 'right content',
    language: 'typescript',
    theme: 'light' as 'light' | 'dark',
    editorOptions: {},
    height: '300px',
    isResizing: false,
    onLeftEditorMount: vi.fn(),
    onRightEditorMount: vi.fn(),
    onPasteLeft: vi.fn(),
    onPasteRight: vi.fn(),
    onClearLeft: vi.fn(),
    onClearRight: vi.fn(),
  };

  it('should render the component with Before and After labels', () => {
    render(<InputEditorPanel {...defaultProps} />);

    expect(screen.getByText('Before')).toBeTruthy();
    expect(screen.getByText('After')).toBeTruthy();
  });

  it('should render two Monaco editors', () => {
    render(<InputEditorPanel {...defaultProps} />);

    const editors = screen.getAllByTestId('monaco-editor');
    expect(editors).toHaveLength(2);
  });

  it('should call onLeftEditorMount when left editor is mounted', async () => {
    const onLeftEditorMount = vi.fn();
    render(<InputEditorPanel {...defaultProps} onLeftEditorMount={onLeftEditorMount} />);

    await vi.waitFor(() => {
      expect(onLeftEditorMount).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onRightEditorMount when right editor is mounted', async () => {
    const onRightEditorMount = vi.fn();
    render(<InputEditorPanel {...defaultProps} onRightEditorMount={onRightEditorMount} />);

    await vi.waitFor(() => {
      expect(onRightEditorMount).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onPasteLeft when left paste button is clicked', async () => {
    const user = userEvent.setup();
    const onPasteLeft = vi.fn();
    render(<InputEditorPanel {...defaultProps} onPasteLeft={onPasteLeft} />);

    const pasteButtons = screen.getAllByTitle(/クリップボードから貼り付け/);
    await user.click(pasteButtons[0]);

    expect(onPasteLeft).toHaveBeenCalledTimes(1);
  });

  it('should call onPasteRight when right paste button is clicked', async () => {
    const user = userEvent.setup();
    const onPasteRight = vi.fn();
    render(<InputEditorPanel {...defaultProps} onPasteRight={onPasteRight} />);

    const pasteButtons = screen.getAllByTitle(/クリップボードから貼り付け/);
    await user.click(pasteButtons[1]);

    expect(onPasteRight).toHaveBeenCalledTimes(1);
  });

  it('should call onClearLeft when left clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClearLeft = vi.fn();
    render(<InputEditorPanel {...defaultProps} onClearLeft={onClearLeft} />);

    const clearButtons = screen.getAllByTitle('クリア');
    await user.click(clearButtons[0]);

    expect(onClearLeft).toHaveBeenCalledTimes(1);
  });

  it('should call onClearRight when right clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClearRight = vi.fn();
    render(<InputEditorPanel {...defaultProps} onClearRight={onClearRight} />);

    const clearButtons = screen.getAllByTitle('クリア');
    await user.click(clearButtons[1]);

    expect(onClearRight).toHaveBeenCalledTimes(1);
  });

  it('should apply light theme to editors', () => {
    render(<InputEditorPanel {...defaultProps} theme="light" />);

    const editors = screen.getAllByTestId('monaco-editor');
    editors.forEach((editor) => {
      expect(editor.getAttribute('data-theme')).toBe('vs');
    });
  });

  it('should apply dark theme to editors', () => {
    render(<InputEditorPanel {...defaultProps} theme="dark" />);

    const editors = screen.getAllByTestId('monaco-editor');
    editors.forEach((editor) => {
      expect(editor.getAttribute('data-theme')).toBe('vs-dark');
    });
  });

  it('should apply resizing class when isResizing is true', () => {
    const { container } = render(<InputEditorPanel {...defaultProps} isResizing={true} />);

    const section = container.querySelector('.input-editor-section');
    expect(section?.className).toContain('resizing');
  });

  it('should not apply resizing class when isResizing is false', () => {
    const { container } = render(<InputEditorPanel {...defaultProps} isResizing={false} />);

    const section = container.querySelector('.input-editor-section');
    expect(section?.className).not.toContain('resizing');
  });

  it('should apply custom height style', () => {
    const { container } = render(<InputEditorPanel {...defaultProps} height="500px" />);

    const section = container.querySelector('.input-editor-section') as HTMLElement;
    expect(section?.style.height).toBe('500px');
  });
});
