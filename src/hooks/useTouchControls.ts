import { useState, useEffect, useRef, useCallback } from 'react';

interface TouchHandlers {
  onTap?: (x: number, y: number) => void;
  onLongPress?: (x: number, y: number) => void;
  onDoubleTap?: (x: number, y: number) => void;
  onPinch?: (scale: number) => void;
}

export function useTouchControls(handlers: TouchHandlers, enabled = true) {
  const touchStartRef = useRef<{ x: number; y: number; time: number; touches: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const [activePinch, setActivePinch] = useState(false);

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
          touches: 1,
        };

        longPressTimerRef.current = window.setTimeout(() => {
          handlers.onLongPress?.(touch.clientX, touch.clientY);
          longPressTimerRef.current = null;
        }, 500);
      } else if (e.touches.length === 2) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
        setActivePinch(true);
      }
    },
    [enabled, handlers]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialPinchDistanceRef.current;
        handlers.onPinch?.(scale);
      }
    },
    [enabled, handlers]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (e.touches.length === 0 && touchStartRef.current && touchStartRef.current.touches === 1) {
        const { x, y, time } = touchStartRef.current;
        const duration = Date.now() - time;

        if (duration < 300 && !activePinch) {
          if (lastTapRef.current && Date.now() - lastTapRef.current.time < 300) {
            handlers.onDoubleTap?.(x, y);
            lastTapRef.current = null;
          } else {
            lastTapRef.current = { x, y, time: Date.now() };
            setTimeout(() => {
              if (lastTapRef.current && Date.now() - lastTapRef.current.time >= 280) {
                handlers.onTap?.(lastTapRef.current.x, lastTapRef.current.y);
                lastTapRef.current = null;
              }
            }, 300);
          }
        }
      }

      if (e.touches.length === 0) {
        touchStartRef.current = null;
        initialPinchDistanceRef.current = null;
        setActivePinch(false);
      }
    },
    [enabled, handlers, activePinch]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
