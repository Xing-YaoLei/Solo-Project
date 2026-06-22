import apiClient from './client'
import { DashboardStats, AuditChecklist, AuditChecklistFormData, ListResponse, SamplingCoverage } from '../types'

export const checklistApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get('/dashboard/stats')
    return res.data
  },

  getSamplingCoverage: async (): Promise<SamplingCoverage> => {
    const res = await apiClient.get('/export/sampling-coverage')
    return res.data
  },

  list: async (params?: {
    skip?: number
    limit?: number
    category?: string
    keyword?: string
  }): Promise<ListResponse<AuditChecklist>> => {
    const res = await apiClient.get('/checklists', { params })
    return res.data
  },

  getCategories: async (): Promise<{ categories: string[] }> => {
    const res = await apiClient.get('/checklists/categories')
    return res.data
  },

  get: async (id: number): Promise<AuditChecklist> => {
    const res = await apiClient.get(`/checklists/${id}`)
    return res.data
  },

  create: async (data: AuditChecklistFormData): Promise<AuditChecklist> => {
    const res = await apiClient.post('/checklists', data)
    return res.data
  },

  update: async (id: number, data: Partial<AuditChecklistFormData>): Promise<AuditChecklist> => {
    const res = await apiClient.put(`/checklists/${id}`, data)
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/checklists/${id}`)
  },
}
