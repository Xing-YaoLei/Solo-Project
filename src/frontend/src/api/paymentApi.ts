import { api } from './axios'
import { Payment, CreatePaymentDto, UpdatePaymentDto } from '@/types/payment'
import { PaginatedResponse } from '@/types/statistics'

export const paymentApi = {
  getPayments: (params?: { pageIndex?: number; pageSize?: number; status?: string; projectId?: string }) => 
    api.get<PaginatedResponse<Payment>>('/payments', { params }),
  
  getPayment: (id: string) => 
    api.get<Payment>(`/payments/${id}`),
  
  createPayment: (data: CreatePaymentDto) => 
    api.post<Payment>('/payments', data),
  
  updatePayment: (id: string, data: UpdatePaymentDto) => 
    api.put<Payment>(`/payments/${id}`, data),
  
  deletePayment: (id: string) => 
    api.delete<void>(`/payments/${id}`),
}
