'use client';

import { useState, useCallback } from 'react';
import type { ApiError } from '@/lib/types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await apiCall;
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setState({ data: null, loading: false, error: apiError });
      throw apiError;
    }
  }, []);

  return { ...state, execute };
}

export default useApi;
