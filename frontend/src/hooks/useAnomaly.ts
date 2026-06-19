import { useState, useEffect, useCallback } from 'react';
import type { AnomalyFlag, AnomalyFetchParams } from '../types';
import { fetchAnomalies, detectAnomalies } from '../api';

export function useAnomaly(params?: AnomalyFetchParams) {
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnomalies(params);
      setAnomalies(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载异常数据失败');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const detect = useCallback(async () => {
    setDetecting(true);
    setError(null);
    try {
      const result = await detectAnomalies();
      setAnomalies(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '异常检测失败');
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { anomalies, loading, detecting, error, refresh: load, detect };
}
