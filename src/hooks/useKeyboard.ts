import { useEffect, useCallback, useRef } from 'react';
import type { KeyboardShortcut } from '../types';

export function useKeyboard(shortcuts: KeyboardShortcut[], globalEnabled = true) {
  const handlersRef = useRef(shortcuts);

  useEffect(() => {
    handlersRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!globalEnabled) return;

    const handlers = handlersRef.current;

    for (const shortcut of handlers) {
      const enabled = shortcut.enabled !== false;
      if (!enabled) continue;

      const keyMatch = shortcut.keys.some(
        (k) => event.key.toLowerCase() === k.toLowerCase()
      );

      if (keyMatch) {
        event.preventDefault();
        shortcut.callback(event.key);
        break;
      }
    }
  }, [globalEnabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export function useNumberKeys(
  count: number,
  onSelect: (index: number) => void,
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [];

  for (let i = 1; i <= Math.min(count, 9); i++) {
    shortcuts.push({
      keys: [i.toString()],
      enabled,
      callback: () => onSelect(i - 1),
    });
  }

  useKeyboard(shortcuts, enabled);
}

export function useNavigationKeys(
  onNext: () => void,
  onPrevious: () => void,
  onConfirm: () => void,
  onCancel: () => void,
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [
    { keys: ['ArrowRight'], enabled, callback: () => onNext() },
    { keys: ['ArrowLeft'], enabled, callback: () => onPrevious() },
    { keys: ['Enter'], enabled, callback: () => onConfirm() },
    { keys: ['Escape'], enabled, callback: () => onCancel() },
  ];

  useKeyboard(shortcuts, enabled);
}

export function useSpaceKey(onPress: () => void, enabled = true) {
  useKeyboard(
    [{ keys: [' ', 'Spacebar'], enabled, callback: () => onPress() }],
    enabled
  );
}
