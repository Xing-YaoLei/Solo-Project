import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { AppealTicket, PaginatedResponse, TransferRequest, RejectRequest } from '@/types'

export function useAppeals(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<AppealTicket>>({
    queryKey: ['appeals', params],
    queryFn: () => api.get(`/appeals${qs ? `?${qs}` : ''}`),
  })
}

export function useAppeal(appealId: string) {
  return useQuery<AppealTicket>({
    queryKey: ['appeals', appealId],
    queryFn: () => api.get(`/appeals/${appealId}`),
    enabled: !!appealId,
  })
}

export function useCreateAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { order_id: string; rider_id: string; appeal_type: string; description: string }) =>
      api.post<AppealTicket>('/appeals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appeals'] }),
  })
}

export function useReviewAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appealId: string) => api.post<AppealTicket>(`/appeals/${appealId}/review`),
    onSuccess: (_d, appealId) => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['appeals', appealId] })
    },
  })
}

export function useRequestSupplement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appealId, description }: { appealId: string; description: string }) =>
      api.post<AppealTicket>(`/appeals/${appealId}/request-supplement`, { description }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['appeals', vars.appealId] })
    },
  })
}

export function useApproveAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appealId: string) => api.post<AppealTicket>(`/appeals/${appealId}/approve`),
    onSuccess: (_d, appealId) => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['appeals', appealId] })
    },
  })
}

export function useRejectAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appealId, ...data }: { appealId: string } & RejectRequest) =>
      api.post<AppealTicket>(`/appeals/${appealId}/reject`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['appeals', vars.appealId] })
    },
  })
}

export function useTransferAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appealId, ...data }: { appealId: string } & TransferRequest) =>
      api.post<AppealTicket>(`/appeals/${appealId}/transfer`, { transfer_to: data.target_user_id, reason: data.reason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['appeals', vars.appealId] })
    },
  })
}

export function useEscalateAppeal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appealId, reason }: { appealId: string; reason: string }) =>
      api.post<AppealTicket>(`/appeals/${appealId}/escalate`, { reason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['appeals'] })
      qc.invalidateQueries({ queryKey: ['appeals', vars.appealId] })
    },
  })
}
