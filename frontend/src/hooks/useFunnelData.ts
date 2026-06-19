import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import type { FunnelData, DateRange, FunnelFilters } from '../types';
import { fetchFunnelData } from '../api';

const DEFAULT_RANGE: DateRange = {
  start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  end: dayjs().format('YYYY-MM-DD'),
};

const DEFAULT_FILTERS: FunnelFilters = {
  revisitResult: '',
  responsibility: '',
  problemTag: '',
};

export function useFunnelData(initialRange?: DateRange) {
  const [dateRange, setDateRange] = useState<DateRange>(initialRange ?? DEFAULT_RANGE);
  const [filters, setFilters] = useState<FunnelFilters>(DEFAULT_FILTERS);
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunnelData(dateRange, filters);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载漏斗数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = useCallback((newFilters: Partial<FunnelFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    data,
    loading,
    error,
    dateRange,
    setDateRange,
    filters,
    applyFilters,
    resetFilters,
    refresh: load,
  };
}
