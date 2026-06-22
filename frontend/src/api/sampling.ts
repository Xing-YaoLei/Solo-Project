import apiClient from './client'
import {
  SamplingRecord,
  SamplingRecordFormData,
  SamplingStatusUpdateData,
  ListResponse,
  StatusChangeLog,
} from '../types'
import { SamplingStatus, EvidenceStatus } from '../types/enums'

export const samplingApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    checklistId?: number
    status?: SamplingStatus
    evidenceStatus?: EvidenceStatus
    keyword?: string
  }): Promise<ListResponse<SamplingRecord>> => {
    const res = await apiClient.get('/sampling', { params })
    return res.data
  },

  get: async (id: number): Promise<SamplingRecord> => {
    const res = await apiClient.get(`/sampling/${id}`)
    return res.data
  },

  create: async (data: SamplingRecordFormData): Promise<SamplingRecord> => {
    const res = await apiClient.post('/sampling', data)
    return res.data
  },

  update: async (id: number, data: Partial<SamplingRecordFormData>): Promise<SamplingRecord> => {
    const res = await apiClient.put(`/sampling/${id}`, data)
    return res.data
  },

  updateStatus: async (id: number, data: SamplingStatusUpdateData): Promise<SamplingRecord> => {
    const res = await apiClient.post(`/sampling/${id}/status`, data)
    return res.data
  },

  getStatusLogs: async (
    id: number,
    params?: { skip?: number; limit?: number }
  ): Promise<ListResponse<StatusChangeLog>> => {
    const res = await apiClient.get(`/sampling/${id}/status-logs`, { params })
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/sampling/${id}`)
  },
}
