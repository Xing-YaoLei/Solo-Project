import api from './client'
import { StatusLog } from '../types'

export const statusLogApi = {
  list: (params: {
    related_type: string
    related_id: number
    skip?: number
    limit?: number
  }) => {
    return api.get<unknown, StatusLog[]>('/status-logs', { params })
  },

  listByType: (related_type: string, params?: {
    skip?: number
    limit?: number
  }) => {
    return api.get<unknown, StatusLog[]>(`/status-logs/by-type/${related_type}`, { params })
  },
}
