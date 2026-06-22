import apiClient from './client'
import {
  ReconciliationRecord,
  CreateReconciliationRequest,
} from '../types'

export const reconciliationApi = {
  getByQuoteId: (quoteId: string): Promise<ReconciliationRecord[]> => {
    return apiClient.get('/reconciliation', { params: { quoteId } })
  },

  create: (quoteId: string, data?: CreateReconciliationRequest): Promise<ReconciliationRecord> => {
    return apiClient.post('/reconciliation', { quoteId, ...data })
  },

  update: (
    id: string,
    data: CreateReconciliationRequest
  ): Promise<ReconciliationRecord> => {
    return apiClient.put(`/reconciliation/${id}`, data)
  },

  resolve: (
    id: string,
    remark: string
  ): Promise<ReconciliationRecord> => {
    return apiClient.post(`/reconciliation/${id}/resolve`, { remark })
  },
}
