import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { CompensationType, CompensationRecord, PaginatedResponse, RejectRequest } from '@/types'

export function useCompensationTypes(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<CompensationType>>({
    queryKey: ['compensation-types', params],
    queryFn: () => api.get(`/compensations/types${qs ? `?${qs}` : ''}`),
  })
}

export function useCompensationRecords(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<CompensationRecord>>({
    queryKey: ['compensation-records', params],
    queryFn: () => api.get(`/compensations/records${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateCompensationType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; code: string; category: string; description?: string; standard_amount: number; max_amount: number; default_amount?: number; requires_photo?: boolean; approval_required?: boolean }) =>
      api.post<CompensationType>('/compensations/types', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compensation-types'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
    },
  })
}

export function useUpdateCompensationType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; category?: string; description?: string; standard_amount?: number; max_amount?: number; default_amount?: number; requires_photo?: boolean; approval_required?: boolean; is_active?: boolean } }) =>
      api.put<CompensationType>(`/compensations/types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compensation-types'] }),
  })
}

export function useCreateCompensationRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { order_id: string; rider_id: string; type_id: string; amount: number; reason: string }) =>
      api.post<CompensationRecord>('/compensations/records', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compensation-records'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
    },
  })
}

export function useApproveCompensation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) => api.post<CompensationRecord>(`/compensations/records/${recordId}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compensation-records'] })
    },
  })
}

export function useRejectCompensation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ recordId, ...data }: { recordId: string } & RejectRequest) =>
      api.post<CompensationRecord>(`/compensations/records/${recordId}/reject`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compensation-records'] }),
  })
}
