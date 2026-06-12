import api, { PageResult } from './client'
import { ExceptionOrder } from '../types'

export const exceptionOrderApi = {
  list: (params: {
    page?: number
    page_size?: number
    keyword?: string
    status?: string
    type?: string
    responsibility_party?: string
    group_batch_id?: number
  }) => {
    return api.get<unknown, PageResult<ExceptionOrder>>('/exception-orders', { params })
  },

  get: (id: number) => {
    return api.get<unknown, ExceptionOrder>(`/exception-orders/${id}`)
  },

  create: (data: Partial<ExceptionOrder>) => {
    return api.post<unknown, ExceptionOrder>('/exception-orders', data)
  },

  update: (id: number, data: Partial<ExceptionOrder>) => {
    return api.put<unknown, ExceptionOrder>(`/exception-orders/${id}`, data)
  },

  process: (id: number, data: {
    status: string
    responsibility_party?: string
    responsibility_detail?: string
    process_result: string
    compensation_amount?: number
    processor?: string
    remark?: string
  }) => {
    return api.post<unknown, ExceptionOrder>(`/exception-orders/${id}/process`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/exception-orders/${id}`)
  },
}
