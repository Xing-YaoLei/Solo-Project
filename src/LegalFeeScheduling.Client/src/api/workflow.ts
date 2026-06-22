import apiClient from './client'
import type { Quote, StatusHistory, WorkflowReasonDto } from '../types'

export const workflowApi = {
  submitForReview: (quoteId: string): Promise<Quote> => {
    return apiClient.post(`/workflow/${quoteId}/submit`)
  },

  approve: (quoteId: string): Promise<Quote> => {
    return apiClient.post(`/workflow/${quoteId}/approve`)
  },

  needMoreInfo: (quoteId: string, reason?: string): Promise<Quote> => {
    const body: WorkflowReasonDto = { reason }
    return apiClient.post(`/workflow/${quoteId}/need-more-info`, body)
  },

  escalate: (quoteId: string, reason?: string): Promise<Quote> => {
    const body: WorkflowReasonDto = { reason }
    return apiClient.post(`/workflow/${quoteId}/escalate`, body)
  },

  startProcessing: (quoteId: string): Promise<Quote> => {
    return apiClient.post(`/workflow/${quoteId}/start-processing`)
  },

  complete: (quoteId: string): Promise<Quote> => {
    return apiClient.post(`/workflow/${quoteId}/complete`)
  },

  close: (quoteId: string): Promise<Quote> => {
    return apiClient.post(`/workflow/${quoteId}/close`)
  },

  handleException: (quoteId: string, reason?: string): Promise<Quote> => {
    const body: WorkflowReasonDto = { reason }
    return apiClient.post(`/workflow/${quoteId}/handle-exception`, body)
  },

  getStatusHistory: (quoteId: string): Promise<StatusHistory[]> => {
    return apiClient.get(`/workflow/${quoteId}/history`)
  },
}
