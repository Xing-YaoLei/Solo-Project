import apiClient from './client'
import {
  RectificationPlan,
  RectificationPlanFormData,
  RectificationStatusUpdateData,
  ListResponse,
  StatusChangeLog,
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
    const res = await apiClient.get('/rectification', { params })
    return res.data
  },

  get: async (id: number): Promise<RectificationPlan> => {
    const res = await apiClient.get(`/rectification/${id}`)
    return res.data
  },

  create: async (data: RectificationPlanFormData): Promise<RectificationPlan> => {
    const res = await apiClient.post('/rectification', data)
    return res.data
  },

  update: async (id: number, data: Partial<RectificationPlanFormData>): Promise<RectificationPlan> => {
    const res = await apiClient.put(`/rectification/${id}`, data)
    return res.data
  },

  updateStatus: async (id: number, data: RectificationStatusUpdateData): Promise<RectificationPlan> => {
    const res = await apiClient.post(`/rectification/${id}/status`, data)
    return res.data
  },

  updateRiskLevel: async (id: number, riskLevel: RiskLevel): Promise<RectificationPlan> => {
    const res = await apiClient.post(`/rectification/${id}/risk-level`, { riskLevel })
    return res.data
  },

  getStatusLogs: async (
    id: number,
    params?: { skip?: number; limit?: number }
  ): Promise<ListResponse<StatusChangeLog>> => {
    const res = await apiClient.get(`/rectification/${id}/status-logs`, { params })
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/rectification/${id}`)
  },
}
