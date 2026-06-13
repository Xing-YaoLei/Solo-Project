const PREFIX = 'beauty-game:';

function prefixedKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function save<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(prefixedKey(key), serialized);
  } catch {
    // silently fail
  }
}

export function load<T>(key: string): T | null {
  try {
    const serialized = localStorage.getItem(prefixedKey(key));
    if (serialized === null) return null;
    return JSON.parse(serialized) as T;
  } catch {
    return null;
  }
}

export function remove(key: string): void {
  localStorage.removeItem(prefixedKey(key));
}

export function clear(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
