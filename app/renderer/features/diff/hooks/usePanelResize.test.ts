import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePanelResize } from './usePanelResize';

describe('usePanelResize', () => {
  beforeEach(() => {
    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1000,
    });

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePanelResize());

      expect(result.current.panelHeight).toBe(350);
      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.isResizing).toBe(false);
      expect(result.current.isMinimized).toBe(false);
    });

    it('should initialize with custom initial height', () => {
      const { result } = renderHook(() => usePanelResize({ initialHeight: 500 }));

      expect(result.current.panelHeight).toBe(500);
    });
  });

  describe('toggleFullscreen', () => {
    it('should toggle fullscreen state', () => {
      const { result } = renderHook(() => usePanelResize());

      expect(result.current.isFullscreen).toBe(false);

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(true);

      act(() => {
        result.current.toggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(false);
    });
  });

  describe('toggleMinimize', () => {
    it('should minimize panel and save current height', () => {
      const { result } = renderHook(() => usePanelResize());

      expect(result.current.isMinimized).toBe(false);

      act(() => {
        result.current.toggleMinimize();
      });

      expect(result.current.isMinimized).toBe(true);
    });

    it('should restore panel to previous height when unminimizing', () => {
      const { result } = renderHook(() => usePanelResize({ initialHeight: 400 }));

      // Minimize
      act(() => {
        result.current.toggleMinimize();
      });

      expect(result.current.isMinimized).toBe(true);

      // Restore
      act(() => {
        result.current.toggleMinimize();
      });

      expect(result.current.isMinimized).toBe(false);
      expect(result.current.panelHeight).toBe(400);
    });

    it('should remember height even after resizing before minimize', () => {
      const { result } = renderHook(() => usePanelResize({ initialHeight: 400 }));

      // Start resize
      act(() => {
        result.current.startResize(500);
      });

      // Simulate mouse move (drag up by 100px)
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 400 });
        document.dispatchEvent(mouseMoveEvent);
      });

      // End resize
      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseUpEvent);
      });

      const heightBeforeMinimize = result.current.panelHeight;

      // Minimize
      act(() => {
        result.current.toggleMinimize();
      });

      // Restore
      act(() => {
        result.current.toggleMinimize();
      });

      expect(result.current.panelHeight).toBe(heightBeforeMinimize);
    });
  });

  describe('startResize', () => {
    it('should set isResizing to true and add class to body', () => {
      const { result } = renderHook(() => usePanelResize());

      act(() => {
        result.current.startResize(500);
      });

      expect(result.current.isResizing).toBe(true);
      expect(document.body.classList.contains('resizing-panel')).toBe(true);
    });
  });

  describe('resize behavior', () => {
    it('should update panel height when dragging', () => {
      const { result } = renderHook(() => usePanelResize({ initialHeight: 400 }));

      // Start resize at Y=500
      act(() => {
        result.current.startResize(500);
      });

      // Move mouse up to Y=400 (delta = -100, so height should increase by 100)
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 400 });
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(500); // 400 + 100
    });

    it('should clamp height to minimum value', () => {
      const { result } = renderHook(() => usePanelResize({ initialHeight: 400, minHeight: 200 }));

      // Start resize
      act(() => {
        result.current.startResize(500);
      });

      // Move mouse down significantly (try to make height very small)
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 1000 });
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(200); // Should be clamped to minHeight
    });

    it('should clamp height to maximum value (80% of window height by default)', () => {
      const { result } = renderHook(() =>
        usePanelResize({ initialHeight: 400, windowHeightOffset: 100 })
      );

      // window.innerHeight = 1000, offset = 100, so container = 900
      // max = 900 * 0.8 = 720

      // Start resize
      act(() => {
        result.current.startResize(500);
      });

      // Move mouse up significantly (try to make height very large)
      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: -500 });
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(720); // Should be clamped to maxHeight
    });

    it('should stop resizing on mouseup', () => {
      const { result } = renderHook(() => usePanelResize());

      // Start resize
      act(() => {
        result.current.startResize(500);
      });

      expect(result.current.isResizing).toBe(true);

      // Mouse up
      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseUpEvent);
      });

      expect(result.current.isResizing).toBe(false);
      expect(document.body.classList.contains('resizing-panel')).toBe(false);
    });

    it('should cancel previous animation frame on rapid mouse movements', () => {
      const { result } = renderHook(() => usePanelResize({ initialHeight: 400 }));
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');

      // Start resize
      act(() => {
        result.current.startResize(500);
      });

      // Dispatch multiple rapid mouse move events
      // The first event will trigger requestAnimationFrame
      // Subsequent events should cancel the previous frame before requesting a new one
      act(() => {
        // First move - will request animation frame (id = 0)
        const mouseMoveEvent1 = new MouseEvent('mousemove', { clientY: 450 });
        document.dispatchEvent(mouseMoveEvent1);

        // Second move - should cancel previous frame (0) before requesting new one
        const mouseMoveEvent2 = new MouseEvent('mousemove', { clientY: 400 });
        document.dispatchEvent(mouseMoveEvent2);

        // Third move - should cancel previous frame before requesting new one
        const mouseMoveEvent3 = new MouseEvent('mousemove', { clientY: 350 });
        document.dispatchEvent(mouseMoveEvent3);
      });

      // Verify that cancelAnimationFrame was called during rapid mouse movements
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(0);

      // Cleanup
      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup');
        document.dispatchEvent(mouseUpEvent);
      });

      cancelAnimationFrameSpy.mockRestore();
    });
  });

  describe('custom options', () => {
    it('should respect custom minHeight', () => {
      const { result } = renderHook(() => usePanelResize({ minHeight: 300 }));

      act(() => {
        result.current.startResize(500);
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: 2000 });
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(300);
    });

    it('should respect custom maxHeightRatio', () => {
      const { result } = renderHook(() =>
        usePanelResize({
          maxHeightRatio: 0.5,
          windowHeightOffset: 0,
        })
      );

      // window.innerHeight = 1000, offset = 0, ratio = 0.5
      // max = 1000 * 0.5 = 500

      act(() => {
        result.current.startResize(500);
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: -500 });
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(500);
    });

    it('should respect custom windowHeightOffset', () => {
      const { result } = renderHook(() =>
        usePanelResize({
          maxHeightRatio: 0.8,
          windowHeightOffset: 200,
        })
      );

      // window.innerHeight = 1000, offset = 200, so container = 800
      // max = 800 * 0.8 = 640

      act(() => {
        result.current.startResize(500);
      });

      act(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', { clientY: -500 });
        document.dispatchEvent(mouseMoveEvent);
      });

      expect(result.current.panelHeight).toBe(640);
    });
  });
});
