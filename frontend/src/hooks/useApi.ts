import { useState, useCallback } from 'react';
import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '../types';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
}

function useApi<T>(apiFn: (...args: unknown[]) => Promise<AxiosResponse<ApiResponse<T>>>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFn(...args);
        const result = response.data;
        if (result.success) {
          setData(result.data);
          return result.data;
        } else {
          setError(result.message);
          return null;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '请求失败';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFn],
  );

  return { data, loading, error, execute };
}

export default useApi;
