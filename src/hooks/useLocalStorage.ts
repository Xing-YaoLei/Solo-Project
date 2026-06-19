import { useState, useCallback, useEffect } from 'react';

const PREFIX = 'bnb_';

function prefixedKey(key: string): string {
  return `${PREFIX}${key}`;
}

function readValue<T>(key: string, initialValue: T | (() => T)): T {
  if (typeof window === 'undefined') {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }

  try {
    const raw = localStorage.getItem(prefixedKey(key));
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch {
    console.error(`Failed to read localStorage key: ${key}`);
  }

  return typeof initialValue === 'function'
    ? (initialValue as () => T)()
    : initialValue;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => readValue(key, initialValue));

  const setValue = useCallback(
    (value: T | ((prevValue: T) => T)) => {
      setStoredValue(prevValue => {
        const valueToStore =
          value instanceof Function ? value(prevValue) : value;

        try {
          localStorage.setItem(prefixedKey(key), JSON.stringify(valueToStore));
        } catch {
          console.error(`Failed to set localStorage key: ${key}`);
        }

        return valueToStore;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(prefixedKey(key));
    } catch {
      console.error(`Failed to remove localStorage key: ${key}`);
    }

    const fallbackValue = typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
    setStoredValue(fallbackValue);
  }, [key, initialValue]);

  useEffect(() => {
    setStoredValue(readValue(key, initialValue));
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === prefixedKey(key) && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          console.error(`Failed to parse storage event for key: ${key}`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
