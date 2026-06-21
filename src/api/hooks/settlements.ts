import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { SettlementBatch, SettlementDetail, PaginatedResponse } from '@/types'

export function useSettlementBatches(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<SettlementBatch>>({
    queryKey: ['settlement-batches', params],
    queryFn: () => api.get(`/settlements/batches${qs ? `?${qs}` : ''}`),
  })
}

export function useSettlementBatch(batchId: string) {
  return useQuery<SettlementBatch>({
    queryKey: ['settlement-batches', batchId],
    queryFn: () => api.get(`/settlements/batches/${batchId}`),
    enabled: !!batchId,
  })
}

export function useSettlementDetails(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<SettlementDetail>>({
    queryKey: ['settlement-details', params],
    queryFn: () => api.get(`/settlements/details${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { period_start: string; period_end: string }) =>
      api.post<SettlementBatch>('/settlements/batches', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settlement-batches'] }),
  })
}

export function useReviewBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => api.post<SettlementBatch>(`/settlements/batches/${batchId}/review`),
    onSuccess: (_d, batchId) => {
      qc.invalidateQueries({ queryKey: ['settlement-batches'] })
      qc.invalidateQueries({ queryKey: ['settlement-batches', batchId] })
    },
  })
}

export function useApproveBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (batchId: string) => api.post<SettlementBatch>(`/settlements/batches/${batchId}/approve`),
    onSuccess: (_d, batchId) => {
      qc.invalidateQueries({ queryKey: ['settlement-batches'] })
      qc.invalidateQueries({ queryKey: ['settlement-batches', batchId] })
    },
  })
}
