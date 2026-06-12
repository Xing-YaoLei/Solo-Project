import { useEffect, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const lastTimeRef = useRef<number>(0);
  const callbackRef = useRef(onTimeUp);

  useEffect(() => {
    callbackRef.current = onTimeUp;
  }, [onTimeUp]);

  const tick = useCallback((delta: number) => {
    if (autoTick && !isPaused && !isGameOver) {
      tickTime(delta);
      
      if (timeRemaining <= 0 && callbackRef.current) {
        callbackRef.current();
      }
    }
  }, [autoTick, isPaused, isGameOver, tickTime, timeRemaining]);

  useFrame((_, delta) => {
    const now = performance.now();
    if (now - lastTimeRef.current >= 100) {
      tick(delta * 1000);
      lastTimeRef.current = now;
    }
  });

  return { tick };
}
