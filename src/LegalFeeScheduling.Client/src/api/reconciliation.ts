import apiClient from './client'
import type {
  ReconciliationRecord,
  CreateReconciliationDto,
  ResolveReconciliationDto,
} from '../types'

export const reconciliationApi = {
  getByQuoteId: (quoteId: string): Promise<ReconciliationRecord[]> => {
    return apiClient.get('/reconciliation', { params: { quoteId } })
  },

  create: (data: CreateReconciliationDto): Promise<ReconciliationRecord> => {
    return apiClient.post('/reconciliation', data)
  },

  update: (
    id: string,
    data: CreateReconciliationDto
  ): Promise<ReconciliationRecord> => {
    return apiClient.put(`/reconciliation/${id}`, data)
  },

  resolve: (
    id: string,
    data: ResolveReconciliationDto
  ): Promise<ReconciliationRecord> => {
    return apiClient.post(`/reconciliation/${id}/resolve`, data)
  },
}
