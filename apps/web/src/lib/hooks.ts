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
  PaymentStatus,
} from '@legal/shared';

interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useQuery<T>(
  url: string | null,
  params?: Record<string, unknown>,
  opts: { skipNull?: boolean } = {},
): UseQueryResult<T> {
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
      .catch((err) => {
        if (opts.skipNull && err.response?.status === 401) {
          setData(null as T);
          return;
        }
        setError(err.response?.data?.message || err.message);
      })
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
  return useQuery<{ items: CaseListItemDTO[]; total: number; page: number; limit: number; totalPages: number }>(
    '/cases',
    filters as Record<string, unknown>,
    { skipNull: true },
  );
}

export function useCaseDetail(id: string | null) {
  return useQuery<CaseDetailDTO>(id ? `/cases/${id}` : null, undefined, { skipNull: true });
}

export function useTimeline(caseId: string | null) {
  return useQuery<TimelineEventDTO[]>(
    caseId ? `/cases/${caseId}/timeline` : null,
    undefined,
    { skipNull: true },
  );
}

export function useMonthlyReport(year: number, month: number, opts?: { lawyerId?: string; caseType?: CaseType; paymentStatus?: PaymentStatus }) {
  return useQuery<MonthlyReportDTO>(
    '/reports/monthly',
    { year, month, ...(opts || {}) },
    { skipNull: true },
  );
}
