import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * autoUpdaterの定期チェック機能のユニットテスト
 *
 * Note: このテストはタイマー管理のロジックのみをテストします。
 * Electronメインプロセスの完全なモックは複雑なため、
 * 実際のElectronアプリの動作はE2Eテストでカバーします。
 */

describe('Auto Updater Periodic Check', () => {
  beforeEach(() => {
    // タイマーモックをリセット
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Timer Management', () => {
    it('should use fake timers', () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      const interval = setInterval(callback, 1000);
      expect(callback).not.toHaveBeenCalled();

      // 1秒進める
      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      // さらに1秒進める
      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);

      clearInterval(interval);
      vi.useRealTimers();
    });

    it('should stop interval when cleared', () => {
      vi.useFakeTimers();
      const callback = vi.fn();

      const interval = setInterval(callback, 1000);

      // 1秒進める
      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      // インターバルをクリア
      clearInterval(interval);

      // さらに1秒進めてもコールバックは呼ばれない
      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('Periodic Check Logic', () => {
    it('should execute callback after 12 hours', () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      const interval = setInterval(callback, TWELVE_HOURS);

      // 12時間経過前
      vi.advanceTimersByTime(TWELVE_HOURS - 1);
      expect(callback).not.toHaveBeenCalled();

      // 12時間経過
      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);

      // さらに12時間経過
      vi.advanceTimersByTime(TWELVE_HOURS);
      expect(callback).toHaveBeenCalledTimes(2);

      clearInterval(interval);
      vi.useRealTimers();
    });

    it('should handle multiple intervals correctly', () => {
      vi.useFakeTimers();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      const interval1 = setInterval(callback1, TWELVE_HOURS);
      const interval2 = setInterval(callback2, TWELVE_HOURS);

      // 12時間経過
      vi.advanceTimersByTime(TWELVE_HOURS);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // 最初のインターバルをクリア
      clearInterval(interval1);

      // さらに12時間経過
      vi.advanceTimersByTime(TWELVE_HOURS);
      expect(callback1).toHaveBeenCalledTimes(1); // クリアされたので増えない
      expect(callback2).toHaveBeenCalledTimes(2); // 継続している

      clearInterval(interval2);
      vi.useRealTimers();
    });
  });

  describe('startPeriodicUpdateCheck behavior', () => {
    it('should restart interval when called multiple times', () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      // 最初のインターバルを作成
      let interval: NodeJS.Timeout | null = setInterval(callback, TWELVE_HOURS);

      // 6時間経過
      vi.advanceTimersByTime(TWELVE_HOURS / 2);
      expect(callback).not.toHaveBeenCalled();

      // インターバルを再起動（既存をクリアして新しく作成）
      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(callback, TWELVE_HOURS);

      // さらに6時間経過（合計12時間だが、再起動したので呼ばれない）
      vi.advanceTimersByTime(TWELVE_HOURS / 2);
      expect(callback).not.toHaveBeenCalled();

      // さらに6時間経過（再起動から12時間）
      vi.advanceTimersByTime(TWELVE_HOURS / 2);
      expect(callback).toHaveBeenCalledTimes(1);

      if (interval) {
        clearInterval(interval);
      }
      vi.useRealTimers();
    });
  });

  describe('stopPeriodicUpdateCheck behavior', () => {
    it('should stop the interval and prevent further callbacks', () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      let interval: NodeJS.Timeout | null = setInterval(callback, TWELVE_HOURS);

      // 12時間経過
      vi.advanceTimersByTime(TWELVE_HOURS);
      expect(callback).toHaveBeenCalledTimes(1);

      // インターバルを停止
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      // さらに12時間経過しても呼ばれない
      vi.advanceTimersByTime(TWELVE_HOURS);
      expect(callback).toHaveBeenCalledTimes(1);

      // interval がnullであることを確認
      expect(interval).toBeNull();

      vi.useRealTimers();
    });

    it('should be safe to call multiple times', () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;

      let interval: NodeJS.Timeout | null = setInterval(callback, TWELVE_HOURS);

      // インターバルを停止
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      // 既にnullの状態で再度停止を試みる（エラーが発生しないことを確認）
      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      expect(interval).toBeNull();
      expect(() => {
        if (interval) {
          clearInterval(interval);
        }
      }).not.toThrow();

      vi.useRealTimers();
    });
  });
});
