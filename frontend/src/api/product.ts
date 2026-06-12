import api, { PageResult } from './client'
import { Product } from '../types'

export const productApi = {
  list: (params: {
    page?: number
    page_size?: number
    keyword?: string
    category?: string
  }) => {
    return api.get<unknown, PageResult<Product>>('/products', { params })
  },

  get: (id: number) => {
    return api.get<unknown, Product>(`/products/${id}`)
  },

  create: (data: Partial<Product>) => {
    return api.post<unknown, Product>('/products', data)
  },

  update: (id: number, data: Partial<Product>) => {
    return api.put<unknown, Product>(`/products/${id}`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/products/${id}`)
  },
}
