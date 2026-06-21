import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { TodoTicket, PaginatedResponse, TransferRequest, RejectRequest } from '@/types'

export function useTodoTickets(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<TodoTicket>>({
    queryKey: ['todo-tickets', params],
    queryFn: () => api.get(`/todo-pool${qs ? `?${qs}` : ''}`),
  })
}

export function useTodoTicket(ticketId: string) {
  return useQuery<TodoTicket>({
    queryKey: ['todo-tickets', ticketId],
    queryFn: () => api.get(`/todo-pool/${ticketId}`),
    enabled: !!ticketId,
  })
}

export function useCreateTodoTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { source_type: string; source_id?: string; title: string; description?: string; priority?: string }) =>
      api.post<TodoTicket>('/todo-pool', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todo-tickets'] }),
  })
}

export function useClaimTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => api.post<TodoTicket>(`/todo-pool/${ticketId}/claim`),
    onSuccess: (_d, ticketId) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', ticketId] })
    },
  })
}

export function useRequestTodoSupplement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, description }: { ticketId: string; description: string }) =>
      api.post<TodoTicket>(`/todo-pool/${ticketId}/request-supplement`, { description }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', vars.ticketId] })
    },
  })
}

export function useRejectTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, ...data }: { ticketId: string } & RejectRequest) =>
      api.post<TodoTicket>(`/todo-pool/${ticketId}/reject`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', vars.ticketId] })
    },
  })
}

export function useTransferTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, ...data }: { ticketId: string } & TransferRequest) =>
      api.post<TodoTicket>(`/todo-pool/${ticketId}/transfer`, { transfer_to: data.target_user_id, reason: data.reason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', vars.ticketId] })
    },
  })
}

export function useResolveTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => api.post<TodoTicket>(`/todo-pool/${ticketId}/resolve`),
    onSuccess: (_d, ticketId) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', ticketId] })
    },
  })
}

export function useUploadTodoSupplement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, description }: { ticketId: string; description: string }) =>
      api.post<TodoTicket>(`/todo-pool/${ticketId}/upload-supplement`, { description }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', vars.ticketId] })
    },
  })
}

export function useCloseTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: string) => api.post<TodoTicket>(`/todo-pool/${ticketId}/close`),
    onSuccess: (_d, ticketId) => {
      qc.invalidateQueries({ queryKey: ['todo-tickets'] })
      qc.invalidateQueries({ queryKey: ['todo-tickets', ticketId] })
    },
  })
}
