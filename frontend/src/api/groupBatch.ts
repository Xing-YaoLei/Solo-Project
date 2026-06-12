import api, { PageResult } from './client'
import { GroupBatch } from '../types'

export const groupBatchApi = {
  list: (params: {
    page?: number
    page_size?: number
    keyword?: string
    status?: string
  }) => {
    return api.get<unknown, PageResult<GroupBatch>>('/group-batches', { params })
  },

  get: (id: number) => {
    return api.get<unknown, GroupBatch>(`/group-batches/${id}`)
  },

  create: (data: Partial<GroupBatch>) => {
    return api.post<unknown, GroupBatch>('/group-batches', data)
  },

  update: (id: number, data: Partial<GroupBatch>) => {
    return api.put<unknown, GroupBatch>(`/group-batches/${id}`, data)
  },

  updateStatus: (id: number, data: {
    status: string
    change_reason?: string
    operator?: string
  }) => {
    return api.patch<unknown, GroupBatch>(`/group-batches/${id}/status`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/group-batches/${id}`)
  },
}
