import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import type { FunnelData, DateRange } from '../types';
import { fetchFunnelData } from '../api';

const DEFAULT_RANGE: DateRange = {
  start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  end: dayjs().format('YYYY-MM-DD'),
};

export function useFunnelData(initialRange?: DateRange) {
  const [dateRange, setDateRange] = useState<DateRange>(initialRange ?? DEFAULT_RANGE);
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunnelData(dateRange);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载漏斗数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, dateRange, setDateRange, refresh: load };
}
