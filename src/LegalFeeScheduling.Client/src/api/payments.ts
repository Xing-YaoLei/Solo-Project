import apiClient from './client'
import {
  PaymentRecord,
  CreatePaymentRequest,
} from '../types'

export const paymentApi = {
  getByQuoteId: (quoteId: string): Promise<PaymentRecord[]> => {
    return apiClient.get('/payments', { params: { quoteId } })
  },

  get: (id: string): Promise<PaymentRecord> => {
    return apiClient.get(`/payments/${id}`)
  },

  create: (data: CreatePaymentRequest): Promise<PaymentRecord> => {
    return apiClient.post('/payments', data)
  },

  update: (id: string, data: CreatePaymentRequest): Promise<PaymentRecord> => {
    return apiClient.put(`/payments/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/payments/${id}`)
  },
}
