import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { SubsidyRule, SubsidyRuleCreate, PaginatedResponse } from '@/types'

export function useSubsidyRules(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<SubsidyRule>>({
    queryKey: ['subsidy-rules', params],
    queryFn: () => api.get(`/subsidy-rules${qs ? `?${qs}` : ''}`),
  })
}

export function useSubsidyRule(ruleId: string) {
  return useQuery<SubsidyRule>({
    queryKey: ['subsidy-rules', ruleId],
    queryFn: () => api.get(`/subsidy-rules/${ruleId}`),
    enabled: !!ruleId,
  })
}

export function useCreateSubsidyRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SubsidyRuleCreate) => api.post<SubsidyRule>('/subsidy-rules', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subsidy-rules'] }),
  })
}

export function useUpdateSubsidyRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubsidyRuleCreate> }) =>
      api.put<SubsidyRule>(`/subsidy-rules/${id}`, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subsidy-rules'] })
      qc.invalidateQueries({ queryKey: ['subsidy-rules', vars.id] })
    },
  })
}

export function useSubmitApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => api.post<SubsidyRule>(`/subsidy-rules/${ruleId}/submit-approval`),
    onSuccess: (_d, ruleId) => {
      qc.invalidateQueries({ queryKey: ['subsidy-rules'] })
      qc.invalidateQueries({ queryKey: ['subsidy-rules', ruleId] })
    },
  })
}

export function useApproveRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => api.post<SubsidyRule>(`/subsidy-rules/${ruleId}/approve`),
    onSuccess: (_d, ruleId) => {
      qc.invalidateQueries({ queryKey: ['subsidy-rules'] })
      qc.invalidateQueries({ queryKey: ['subsidy-rules', ruleId] })
    },
  })
}

export function useRejectRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, reason }: { ruleId: string; reason: string }) =>
      api.post<SubsidyRule>(`/subsidy-rules/${ruleId}/reject`, { reason }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subsidy-rules'] })
      qc.invalidateQueries({ queryKey: ['subsidy-rules', vars.ruleId] })
    },
  })
}
