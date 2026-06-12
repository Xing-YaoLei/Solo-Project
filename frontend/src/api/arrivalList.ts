import api, { PageResult } from './client'
import { ArrivalList } from '../types'

export const arrivalListApi = {
  list: (params: {
    page?: number
    page_size?: number
    keyword?: string
    status?: string
    group_batch_id?: number
  }) => {
    return api.get<unknown, PageResult<ArrivalList>>('/arrival-lists', { params })
  },

  get: (id: number) => {
    return api.get<unknown, ArrivalList>(`/arrival-lists/${id}`)
  },

  create: (data: Partial<ArrivalList>) => {
    return api.post<unknown, ArrivalList>('/arrival-lists', data)
  },

  update: (id: number, data: Partial<ArrivalList>) => {
    return api.put<unknown, ArrivalList>(`/arrival-lists/${id}`, data)
  },

  confirm: (id: number, data: {
    actual_quantity: number
    arrival_time?: string
    warehouse_operator?: string
    remark?: string
    create_exception_on_shortage?: boolean
  }) => {
    return api.post<unknown, ArrivalList>(`/arrival-lists/${id}/confirm`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/arrival-lists/${id}`)
  },
}
