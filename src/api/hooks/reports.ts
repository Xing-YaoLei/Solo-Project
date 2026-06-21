import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export function useDispatchReport(params?: Record<string, string>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, v))
  const qs = query.toString()
  return useQuery({
    queryKey: ['report-dispatch', params],
    queryFn: () => api.get(`/reports/dispatch-duration${qs ? `?${qs}` : ''}`),
  })
}

export function useSubsidySummaryReport(params?: Record<string, string>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, v))
  const qs = query.toString()
  return useQuery({
    queryKey: ['report-subsidy-summary', params],
    queryFn: () => api.get(`/reports/subsidy-summary${qs ? `?${qs}` : ''}`),
  })
}

export function usePerformanceReport(params?: Record<string, string>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, v))
  const qs = query.toString()
  return useQuery({
    queryKey: ['report-performance', params],
    queryFn: () => api.get(`/reports/performance${qs ? `?${qs}` : ''}`),
  })
}
