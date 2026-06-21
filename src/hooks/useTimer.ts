import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  initialTime: number;
  autoStart?: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newTime?: number) => void;
  stop: () => void;
  elapsed: number;
  formatTime: (seconds: number) => string;
}

export const useTimer = ({
  initialTime,
  autoStart = true,
  onComplete,
  onTick,
}: UseTimerOptions): UseTimerReturn => {
  const [remaining, setRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());
  const savedRemainingRef = useRef<number>(initialTime);

  const formatTime = useCallback((seconds: number): string => {
    const safe = Math.max(0, Math.floor(seconds));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setRemaining(prev => {
      const next = prev - 0.1;
      if (onTick) onTick(next);
      if (next <= 0) {
        clear();
        setIsRunning(false);
        if (onComplete) onComplete();
        return 0;
      }
      return next;
    });
  }, [clear, onComplete, onTick]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      startRef.current = Date.now();
      intervalRef.current = window.setInterval(tick, 100);
    }
    return clear;
  }, [isRunning, isPaused, tick, clear]);

  const start = useCallback(() => {
    setRemaining(initialTime);
    savedRemainingRef.current = initialTime;
    setIsPaused(false);
    setIsRunning(true);
  }, [initialTime]);

  const pause = useCallback(() => {
    savedRemainingRef.current = remaining;
    setIsPaused(true);
    setIsRunning(false);
    clear();
  }, [remaining, clear]);

  const resume = useCallback(() => {
    setRemaining(savedRemainingRef.current);
    setIsPaused(false);
    setIsRunning(true);
  }, []);

  const reset = useCallback((newTime?: number) => {
    const t = newTime !== undefined ? newTime : initialTime;
    savedRemainingRef.current = t;
    setRemaining(t);
    setIsPaused(false);
    setIsRunning(autoStart);
  }, [initialTime, autoStart]);

  const stop = useCallback(() => {
    clear();
    setIsRunning(false);
    setIsPaused(false);
  }, [clear]);

  return {
    remaining,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    stop,
    elapsed: initialTime - remaining,
    formatTime,
  };
};
