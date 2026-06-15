import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
  dashboard: {
    getOverview: () => request<any>('/dashboard/overview'),
    getTrend: (days: number = 30) => request<any>(`/dashboard/trend?days=${days}`),
    getChapterDistribution: () => request<any[]>('/dashboard/chapter-distribution'),
    getHomeworkFunnel: () => request<any[]>('/dashboard/homework-funnel'),
    getTagRanking: () => request<any[]>('/dashboard/tag-ranking'),
    getProgressTrend: () => request<any[]>('/dashboard/progress-trend'),
  },
  import: {
    getBatches: (skip: number = 0, limit: number = 50) =>
      request<any>(`/import/batches?skip=${skip}&limit=${limit}`),
    triggerImport: (source: string, remark?: string) =>
      request<any>('/import/trigger', {
        method: 'POST',
        body: JSON.stringify({ source, remark }),
      }),
    rollback: (batchId: string) =>
      request<any>(`/import/rollback/${batchId}`, {
        method: 'POST',
      }),
    addNote: (note: any) =>
      request<any>('/import/notes', {
        method: 'POST',
        body: JSON.stringify(note),
      }),
    getNotes: (date?: string) =>
      request<any>(`/import/notes${date ? `?date=${date}` : ''}`),
  },
  caliber: {
    getVersions: () => request<any>('/caliber/versions'),
    createVersion: (data: any) =>
      request<any>('/caliber/versions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    activateVersion: (version: string) =>
      request<any>(`/caliber/versions/${version}/activate`, {
        method: 'PUT',
      }),
  },
};
