type TokenListener = (token: string | null) => void;

let currentToken: string | null = null;
const listeners: TokenListener[] = [];

function notify(token: string | null) {
  listeners.forEach((fn) => fn(token));
}

export function getToken(): string | null {
  if (currentToken) return currentToken;

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.token) {
          currentToken = parsed.state.token;
          return currentToken;
        }
      } catch (_) {
        // ignore
      }
    }
    currentToken = localStorage.getItem('token');
  }

  return currentToken;
}

export function setToken(token: string | null): void {
  currentToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
    }
  }
  notify(token);
}

export function clearToken(): void {
  setToken(null);
}

export function subscribe(fn: TokenListener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function initTokenStore(): void {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.token) {
        currentToken = parsed.state.token;
        localStorage.setItem('token', parsed.state.token);
      }
      if (parsed.state?.user) {
        localStorage.setItem('user', JSON.stringify(parsed.state.user));
      }
    } catch (_) {
      // ignore
    }
  }

  if (!currentToken) {
    currentToken = localStorage.getItem('token');
  }
}
