import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface UseGameLoopOptions {
  autoTick?: boolean;
  onTimeUp?: () => void;
}

export function useGameLoop(options: UseGameLoopOptions = {}) {
  const { autoTick = true, onTimeUp } = options;
  const tickTime = useGameStore((state) => state.tickTime);
  const isPaused = useGameStore((state) => state.isPaused);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const timeRemaining = useGameStore((state) => state.timeRemaining);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const callbackRef = useRef(onTimeUp);
  const isPausedRef = useRef(isPaused);
  const isGameOverRef = useRef(isGameOver);
  const timeRemainingRef = useRef(timeRemaining);
  const tickTimeRef = useRef(tickTime);
  const autoTickRef = useRef(autoTick);

  useEffect(() => {
    callbackRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    tickTimeRef.current = tickTime;
  }, [tickTime]);

  useEffect(() => {
    autoTickRef.current = autoTick;
  }, [autoTick]);

  const tick = useCallback((delta: number) => {
    if (autoTickRef.current && !isPausedRef.current && !isGameOverRef.current) {
      tickTimeRef.current(delta);

      if (timeRemainingRef.current <= 0 && callbackRef.current) {
        callbackRef.current();
      }
    }
  }, []);

  useEffect(() => {
    if (!autoTick) return;

    const animate = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
      }

      const delta = now - lastTimeRef.current;
      if (delta >= 100) {
        tick(delta);
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoTick, tick]);

  return { tick };
}
