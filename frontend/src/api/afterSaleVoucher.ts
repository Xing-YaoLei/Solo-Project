import api, { PageResult } from './client'
import { AfterSaleVoucher } from '../types'

export const afterSaleVoucherApi = {
  list: (params: {
    page?: number
    page_size?: number
    keyword?: string
    status?: string
    type?: string
    pickup_code_id?: number
  }) => {
    return api.get<unknown, PageResult<AfterSaleVoucher>>('/after-sale-vouchers', { params })
  },

  get: (id: number) => {
    return api.get<unknown, AfterSaleVoucher>(`/after-sale-vouchers/${id}`)
  },

  create: (data: Partial<AfterSaleVoucher>) => {
    return api.post<unknown, AfterSaleVoucher>('/after-sale-vouchers', data)
  },

  update: (id: number, data: Partial<AfterSaleVoucher>) => {
    return api.put<unknown, AfterSaleVoucher>(`/after-sale-vouchers/${id}`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/after-sale-vouchers/${id}`)
  },
}
