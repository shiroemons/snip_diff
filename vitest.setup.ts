import { vi } from 'vitest';

// Monaco Editorのグローバルモック
// ※テストファイルでモックを再定義する場合は、そちらが優先されます
vi.mock('monaco-editor', async () => {
  class MockRange {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number,
    ) {}
  }

  class MockPosition {
    constructor(public lineNumber: number, public column: number) {}
  }

  return {
    default: {
      editor: {
        defineTheme: vi.fn(),
      },
    },
    editor: {
      defineTheme: vi.fn(),
      TrackedRangeStickiness: {
        NeverGrowsWhenTypingAtEdges: 0,
      },
    },
    languages: {},
    Range: MockRange,
    Position: MockPosition,
  };
});
