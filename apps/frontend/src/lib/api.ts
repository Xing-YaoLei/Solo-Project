import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

let tokenCache: string | null = null;

useAuthStore.subscribe((state) => {
  tokenCache = state.token;
  if (typeof window !== 'undefined') {
    if (state.token) {
      localStorage.setItem('token', state.token);
      if (state.user) {
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.token) {
        tokenCache = parsed.state.token;
        localStorage.setItem('token', parsed.state.token);
      }
      if (parsed.state?.user) {
        localStorage.setItem('user', JSON.stringify(parsed.state.user));
      }
    } catch (e) {
      // ignore
    }
  }
  if (!tokenCache) {
    tokenCache = localStorage.getItem('token');
  }
}

api.interceptors.request.use(
  (config) => {
    let token = tokenCache;

    if (!token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          token = parsed.state?.token || null;
          if (token) tokenCache = token;
        } catch (e) {
          // ignore
        }
      }
      if (!token) {
        token = localStorage.getItem('token');
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        useAuthStore.getState().token = null;
        useAuthStore.getState().user = null;
        tokenCache = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
