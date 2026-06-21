'use client';

import { useState, useEffect, useCallback } from 'react';
import api from './api';
import type {
  CaseListItemDTO,
  CaseDetailDTO,
  TimelineEventDTO,
  MonthlyReportDTO,
  CaseStatus,
  CaseType,
} from '@legal/shared';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useQuery<T>(url: string | null, params?: Record<string, unknown>): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get(url, { params })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [url, JSON.stringify(params)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCases(filters?: {
  caseType?: CaseType;
  status?: CaseStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{ items: CaseListItemDTO[]; total: number }>('/cases', filters as Record<string, unknown>);
}

export function useCaseDetail(id: string | null) {
  return useQuery<CaseDetailDTO>(id ? `/cases/${id}` : null);
}

export function useTimeline(caseId: string | null) {
  return useQuery<TimelineEventDTO[]>(caseId ? `/cases/${caseId}/timeline` : null);
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery<MonthlyReportDTO>('/reports/monthly', { year, month });
}
