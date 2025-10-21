import { useState, useRef, useEffect, useCallback } from 'react';

export interface UsePanelResizeReturn {
  /** 現在のパネルの高さ（ピクセル） */
  panelHeight: number;
  /** パネルが全画面モードかどうか */
  isFullscreen: boolean;
  /** パネルがリサイズ中かどうか */
  isResizing: boolean;
  /** パネルが最小化されているかどうか */
  isMinimized: boolean;
  /** 全画面モードの切り替え */
  toggleFullscreen: () => void;
  /** 最小化モードの切り替え */
  toggleMinimize: () => void;
  /** リサイズ開始（mousedownで呼び出す） */
  startResize: (clientY: number) => void;
}

export interface UsePanelResizeOptions {
  /** 初期パネル高さ（ピクセル） */
  initialHeight?: number;
  /** 最小パネル高さ（ピクセル） */
  minHeight?: number;
  /** ウィンドウ高さに対する最大パネル高さの比率 */
  maxHeightRatio?: number;
  /** ウィンドウ高さから差し引くオフセット（ヘッダー/フッター用） */
  windowHeightOffset?: number;
}

/**
 * リサイズ可能なパネルの状態と動作を管理するカスタムフック
 * @param options - 設定オプション
 * @returns パネルの状態と制御関数
 */
export const usePanelResize = (
  options: UsePanelResizeOptions = {},
): UsePanelResizeReturn => {
  const {
    initialHeight = 350,
    minHeight = 200,
    maxHeightRatio = 0.8,
    windowHeightOffset = 100,
  } = options;

  const [panelHeight, setPanelHeight] = useState(initialHeight);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const dragStartRef = useRef<{ y: number; height: number } | null>(null);
  const lastHeightRef = useRef<number>(initialHeight);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => {
      if (prev) {
        // 最小化から復元
        setPanelHeight(lastHeightRef.current);
        return false;
      }
      // 最小化
      lastHeightRef.current = panelHeight;
      return true;
    });
  }, [panelHeight]);

  const startResize = useCallback(
    (clientY: number) => {
      dragStartRef.current = {
        y: clientY,
        height: panelHeight,
      };
      setIsResizing(true);
      document.body.classList.add('resizing-panel');
    },
    [panelHeight],
  );

  // リサイズ中のマウス移動とマウスアップを処理
  useEffect(() => {
    if (!isResizing || !dragStartRef.current) return;

    let animationFrameId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (!dragStartRef.current) return;

        const deltaY = dragStartRef.current.y - e.clientY;
        const newHeight = dragStartRef.current.height + deltaY;

        const containerHeight = window.innerHeight - windowHeightOffset;
        const maxHeight = containerHeight * maxHeightRatio;
        const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

        setPanelHeight(clampedHeight);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      dragStartRef.current = null;
      document.body.classList.remove('resizing-panel');
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing-panel');
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isResizing, minHeight, maxHeightRatio, windowHeightOffset]);

  return {
    panelHeight,
    isFullscreen,
    isResizing,
    isMinimized,
    toggleFullscreen,
    toggleMinimize,
    startResize,
  };
};
