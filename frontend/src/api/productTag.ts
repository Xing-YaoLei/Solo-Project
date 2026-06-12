import api from './client'
import { ProductTag } from '../types'

export const productTagApi = {
  list: (params?: {
    arrival_list_id?: number
    tag_type?: string
  }) => {
    return api.get<unknown, ProductTag[]>('/product-tags', { params })
  },

  get: (id: number) => {
    return api.get<unknown, ProductTag>(`/product-tags/${id}`)
  },

  create: (data: Partial<ProductTag>) => {
    return api.post<unknown, ProductTag>('/product-tags', data)
  },

  update: (id: number, data: Partial<ProductTag>) => {
    return api.put<unknown, ProductTag>(`/product-tags/${id}`, data)
  },

  delete: (id: number) => {
    return api.delete<unknown, boolean>(`/product-tags/${id}`)
  },
}
