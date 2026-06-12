import api, { PageResult } from './client'
import { PickupCode } from '../types'

export const pickupCodeApi = {
  list: (params: {
    page?: number
    page_size?: number
    keyword?: string
    status?: string
    group_batch_id?: number
  }) => {
    return api.get<unknown, PageResult<PickupCode>>('/pickup-codes', { params })
  },

  get: (id: number) => {
    return api.get<unknown, PickupCode>(`/pickup-codes/${id}`)
  },

  create: (data: Partial<PickupCode>) => {
    return api.post<unknown, PickupCode>('/pickup-codes', data)
  },

  update: (id: number, data: Partial<PickupCode>) => {
    return api.put<unknown, PickupCode>(`/pickup-codes/${id}`, data)
  },

  updateStatus: (id: number, data: {
    status: string
    change_reason?: string
    operator?: string
  }) => {
    return api.patch<unknown, PickupCode>(`/pickup-codes/${id}/status`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/pickup-codes/${id}`)
  },
}
