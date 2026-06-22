import apiClient from './client'
import { StatusHistory, Quote, WorkflowActionRequest } from '../types'

export const workflowApi = {
  getHistory: (quoteId: string): Promise<StatusHistory[]> => {
    return apiClient.get(`/quotes/${quoteId}/history`)
  },

  submitForReview: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/submit', data)
  },

  approve: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/approve', data)
  },

  reject: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/reject', data)
  },

  requestMoreInfo: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/request-more-info', data)
  },

  escalate: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/escalate', data)
  },

  startProcessing: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/start-processing', data)
  },

  markReconciled: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/mark-reconciled', data)
  },

  markReviewed: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/mark-reviewed', data)
  },

  markCompleted: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/mark-completed', data)
  },

  closeArchive: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/close-archive', data)
  },

  resolveException: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/resolve-exception', data)
  },

  cancel: (data: WorkflowActionRequest): Promise<Quote> => {
    return apiClient.post('/workflow/cancel', data)
  },
}
