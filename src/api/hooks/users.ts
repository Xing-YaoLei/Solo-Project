import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { User, PaginatedResponse } from '@/types'

export function useUsers(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', params],
    queryFn: () => api.get(`/users${qs ? `?${qs}` : ''}`),
  })
}
