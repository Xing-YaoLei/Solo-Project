import apiClient from './client'
import {
  RectificationPlan,
  RectificationPlanFormData,
  RectificationStatusUpdateData,
  ListResponse,
} from '../types'
import { RiskLevel, RectificationStatus } from '../types/enums'

export const rectificationApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    samplingId?: number
    riskLevel?: RiskLevel
    status?: RectificationStatus
    vendorId?: number
  }): Promise<ListResponse<RectificationPlan>> => {
    const res = await apiClient.get('/rectifications', { params })
    return res.data
  },

  listByRiskGroup: async (): Promise<Record<string, RectificationPlan[]>> => {
    const res = await apiClient.get('/rectifications/by-risk')
    return res.data
  },

  get: async (id: number): Promise<RectificationPlan> => {
    const res = await apiClient.get(`/rectifications/${id}`)
    return res.data
  },

  create: async (data: RectificationPlanFormData): Promise<RectificationPlan> => {
    const res = await apiClient.post('/rectifications', data)
    return res.data
  },

  update: async (id: number, data: Partial<RectificationPlanFormData>): Promise<RectificationPlan> => {
    const res = await apiClient.put(`/rectifications/${id}`, data)
    return res.data
  },

  updateStatus: async (id: number, data: RectificationStatusUpdateData): Promise<RectificationPlan> => {
    const res = await apiClient.post(`/rectifications/${id}/status`, data)
    return res.data
  },

  getStatusLogs: async (
    id: number,
    params?: { skip?: number; limit?: number }
  ): Promise<ListResponse<any>> => {
    const res = await apiClient.get(`/rectifications/${id}/status-logs`, { params })
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/rectifications/${id}`)
  },
}
