import { useState, useRef, useCallback, useEffect } from 'react';

export interface HesitationPoint {
  id: string;
  timestamp: number;
  duration: number;
  type: 'hover' | 'focus';
}

interface TrackedElement {
  id: string;
  hoverStartTime: number | null;
  focusStartTime: number | null;
  hoverTimer: ReturnType<typeof setTimeout> | null;
  focusTimer: ReturnType<typeof setTimeout> | null;
  hoverHandler: () => void;
  hoverLeaveHandler: () => void;
  focusHandler: () => void;
  blurHandler: () => void;
}

export function useHesitation(
  onHesitation?: (point: HesitationPoint) => void,
  threshold: number = 2000
) {
  const [hesitationPoints, setHesitationPoints] = useState<HesitationPoint[]>([]);
  const trackedElements = useRef<Map<string, TrackedElement>>(new Map());
  const elementRefs = useRef<Map<string, HTMLElement>>(new Map());

  const getHesitationPoints = useCallback(() => {
    return [...hesitationPoints];
  }, [hesitationPoints]);

  const addHesitationPoint = useCallback(
    (point: HesitationPoint) => {
      setHesitationPoints(prev => [...prev, point]);
      if (onHesitation) {
        onHesitation(point);
      }
    },
    [onHesitation]
  );

  const trackElement = useCallback(
    (id: string, elementRef: React.RefObject<HTMLElement>) => {
      const element = elementRef.current;
      if (!element) return;

      if (trackedElements.current.has(id)) {
        return;
      }

      elementRefs.current.set(id, element);

      const tracked: TrackedElement = {
        id,
        hoverStartTime: null,
        focusStartTime: null,
        hoverTimer: null,
        focusTimer: null,
        hoverHandler: () => {
          tracked.hoverStartTime = Date.now();
          tracked.hoverTimer = setTimeout(() => {
            if (tracked.hoverStartTime !== null) {
              const duration = Date.now() - tracked.hoverStartTime;
              addHesitationPoint({
                id,
                timestamp: Date.now(),
                duration,
                type: 'hover',
              });
            }
          }, threshold);
        },
        hoverLeaveHandler: () => {
          if (tracked.hoverTimer) {
            clearTimeout(tracked.hoverTimer);
            tracked.hoverTimer = null;
          }
          tracked.hoverStartTime = null;
        },
        focusHandler: () => {
          tracked.focusStartTime = Date.now();
          tracked.focusTimer = setTimeout(() => {
            if (tracked.focusStartTime !== null) {
              const duration = Date.now() - tracked.focusStartTime;
              addHesitationPoint({
                id,
                timestamp: Date.now(),
                duration,
                type: 'focus',
              });
            }
          }, threshold);
        },
        blurHandler: () => {
          if (tracked.focusTimer) {
            clearTimeout(tracked.focusTimer);
            tracked.focusTimer = null;
          }
          tracked.focusStartTime = null;
        },
      };

      element.addEventListener('mouseenter', tracked.hoverHandler);
      element.addEventListener('mouseleave', tracked.hoverLeaveHandler);
      element.addEventListener('focus', tracked.focusHandler);
      element.addEventListener('blur', tracked.blurHandler);

      trackedElements.current.set(id, tracked);
    },
    [addHesitationPoint, threshold]
  );

  const untrackElement = useCallback((id: string) => {
    const tracked = trackedElements.current.get(id);
    const element = elementRefs.current.get(id);

    if (tracked && element) {
      element.removeEventListener('mouseenter', tracked.hoverHandler);
      element.removeEventListener('mouseleave', tracked.hoverLeaveHandler);
      element.removeEventListener('focus', tracked.focusHandler);
      element.removeEventListener('blur', tracked.blurHandler);

      if (tracked.hoverTimer) clearTimeout(tracked.hoverTimer);
      if (tracked.focusTimer) clearTimeout(tracked.focusTimer);
    }

    trackedElements.current.delete(id);
    elementRefs.current.delete(id);
  }, []);

  useEffect(() => {
    return () => {
      trackedElements.current.forEach((_, id) => {
        untrackElement(id);
      });
    };
  }, [untrackElement]);

  return {
    trackElement,
    untrackElement,
    getHesitationPoints,
    hesitationPoints,
  };
}
