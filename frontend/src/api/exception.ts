import apiClient from './client'
import {
  ExceptionOrder,
  ExceptionOrderFormData,
  ExceptionStatusUpdateData,
  ListResponse,
  StatusChangeLog,
} from '../types'
import { ExceptionStatus, ExceptionType } from '../types/enums'

export const exceptionApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    samplingId?: number
    exceptionType?: ExceptionType
    status?: ExceptionStatus
  }): Promise<ListResponse<ExceptionOrder>> => {
    const res = await apiClient.get('/exceptions', { params })
    return res.data
  },

  get: async (id: number): Promise<ExceptionOrder> => {
    const res = await apiClient.get(`/exceptions/${id}`)
    return res.data
  },

  create: async (data: ExceptionOrderFormData): Promise<ExceptionOrder> => {
    const res = await apiClient.post('/exceptions', data)
    return res.data
  },

  update: async (id: number, data: Partial<ExceptionOrderFormData>): Promise<ExceptionOrder> => {
    const res = await apiClient.put(`/exceptions/${id}`, data)
    return res.data
  },

  updateStatus: async (id: number, data: ExceptionStatusUpdateData): Promise<ExceptionOrder> => {
    const res = await apiClient.post(`/exceptions/${id}/status`, data)
    return res.data
  },

  getStatusLogs: async (
    id: number,
    params?: { skip?: number; limit?: number }
  ): Promise<ListResponse<StatusChangeLog>> => {
    const res = await apiClient.get(`/exceptions/${id}/status-logs`, { params })
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/exceptions/${id}`)
  },
}
