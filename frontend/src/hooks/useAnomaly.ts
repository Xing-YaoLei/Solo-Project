import { useState, useEffect, useCallback } from 'react';
import type { AnomalyFlag } from '../types';
import { detectAnomalies, fetchAnomalies } from '../api';

export function useAnomaly() {
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAnomalies();
      setAnomalies(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载异常数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    detect();
  }, [detect]);

  return { anomalies, loading, detecting, error, refresh: detect, detect, load };
}
