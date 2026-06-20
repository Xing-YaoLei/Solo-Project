import { useEffect, useCallback } from 'react';
import type { GamePhase } from '../types';

interface KeyboardHandlers {
  onPhaseJump?: (phase: GamePhase) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onTabPanel?: () => void;
  onResetView?: () => void;
}

export function useKeyboardControls(handlers: KeyboardHandlers, enabled = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '1':
          handlers.onPhaseJump?.('RULES');
          break;
        case '2':
          handlers.onPhaseJump?.('LOCKING');
          break;
        case '3':
          handlers.onPhaseJump?.('CHECKING');
          break;
        case '4':
          handlers.onPhaseJump?.('REVIEW');
          break;
        case ' ':
          e.preventDefault();
          handlers.onConfirm?.();
          break;
        case 'Escape':
          handlers.onCancel?.();
          break;
        case 'Tab':
          e.preventDefault();
          handlers.onTabPanel?.();
          break;
        case 'r':
        case 'R':
          handlers.onResetView?.();
          break;
        default:
          break;
      }
    },
    [handlers, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
