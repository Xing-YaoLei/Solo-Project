import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  initialTime?: number;
  autoStart?: boolean;
  onTick?: (time: number) => void;
  onComplete?: () => void;
  interval?: number;
}

export function useTimer(options: UseTimerOptions = {}) {
  const {
    initialTime = 0,
    autoStart = false,
    onTick,
    onComplete,
    interval = 1000,
  } = options;

  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    
    startTimeRef.current = Date.now() - accumulatedTimeRef.current;
    setIsRunning(true);
  }, [isRunning]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback((newTime = initialTime) => {
    clearTimer();
    accumulatedTimeRef.current = 0;
    setTime(newTime);
    setIsRunning(false);
  }, [clearTimer, initialTime]);

  const restart = useCallback((newTime = initialTime) => {
    reset(newTime);
    start();
  }, [reset, start, initialTime]);

  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      accumulatedTimeRef.current = elapsed;
      const newTime = Math.floor(elapsed / 1000);
      
      setTime(newTime);
      onTick?.(newTime);
    }, interval);

    return clearTimer;
  }, [isRunning, interval, clearTimer, onTick]);

  useEffect(() => {
    if (initialTime > 0 && time >= initialTime && isRunning) {
      pause();
      onComplete?.();
    }
  }, [time, initialTime, isRunning, pause, onComplete]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  return {
    time,
    isRunning,
    start,
    pause,
    reset,
    restart,
    setTime,
  };
}

export function useCountdown(
  duration: number,
  onTick?: (time: number) => void,
  onComplete?: () => void
) {
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback((newDuration = duration) => {
    clearTimer();
    setRemaining(newDuration);
    setIsRunning(false);
  }, [clearTimer, duration]);

  const restart = useCallback((newDuration = duration) => {
    reset(newDuration);
    start();
  }, [reset, start, duration]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          onComplete?.();
        }
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, remaining, clearTimer, onTick, onComplete]);

  const percentage = duration > 0 ? (remaining / duration) * 100 : 0;
  const isUrgent = remaining <= Math.max(5, duration * 0.1);

  return {
    remaining,
    percentage,
    isUrgent,
    isRunning,
    start,
    pause,
    reset,
    restart,
  };
}
