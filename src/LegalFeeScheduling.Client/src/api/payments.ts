import apiClient from './client'
import type {
  PaymentRecord,
  CreatePaymentDto,
} from '../types'

export const paymentApi = {
  getByQuoteId: (quoteId: string): Promise<PaymentRecord[]> => {
    return apiClient.get('/payments', { params: { quoteId } })
  },

  get: (id: string): Promise<PaymentRecord> => {
    return apiClient.get(`/payments/${id}`)
  },

  create: (data: CreatePaymentDto): Promise<PaymentRecord> => {
    return apiClient.post('/payments', data)
  },

  update: (id: string, data: CreatePaymentDto): Promise<PaymentRecord> => {
    return apiClient.put(`/payments/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/payments/${id}`)
  },
}
