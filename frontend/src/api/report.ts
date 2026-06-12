import api from './client'
import { DeliveryPerformance, TrendData } from '../types'

export const reportApi = {
  getDeliveryPerformance: (params?: {
    start_date?: string
    end_date?: string
  }) => {
    return api.get<unknown, DeliveryPerformance>('/reports/delivery-performance', { params })
  },

  getDeliveryTrend: (params?: {
    start_date?: string
    end_date?: string
  }) => {
    return api.get<unknown, TrendData[]>('/reports/delivery-trend', { params })
  },

  exportExcel: (params?: {
    start_date?: string
    end_date?: string
  }) => {
    return api.post<unknown, { task_id: string }>('/reports/export/excel', null, { params })
  },

  getExportStatus: (taskId: string) => {
    return api.get<unknown, { state: string; status: string; result?: any }>(
      `/reports/export/status/${taskId}`
    )
  },
}
