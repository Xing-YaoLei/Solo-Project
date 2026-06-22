import apiClient from './client'
import {
  Quote,
  QuoteItem,
  QuoteListFilter,
  PagedResult,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  AmountCheckResult,
} from '../types'

export const quoteApi = {
  getList: (filter: QuoteListFilter): Promise<PagedResult<Quote>> => {
    return apiClient.get('/quotes', { params: filter })
  },

  getById: (id: string): Promise<Quote> => {
    return apiClient.get(`/quotes/${id}`)
  },

  getByNo: (quoteNo: string): Promise<Quote> => {
    return apiClient.get(`/quotes/no/${quoteNo}`)
  },

  create: (data: CreateQuoteRequest): Promise<Quote> => {
    return apiClient.post('/quotes', data)
  },

  update: (id: string, data: UpdateQuoteRequest): Promise<Quote> => {
    return apiClient.put(`/quotes/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return apiClient.delete(`/quotes/${id}`)
  },

  addItem: (quoteId: string, data: QuoteItem): Promise<QuoteItem> => {
    return apiClient.post(`/quotes/${quoteId}/items`, data)
  },

  updateItem: (
    quoteId: string,
    itemId: string,
    data: QuoteItem
  ): Promise<QuoteItem> => {
    return apiClient.put(`/quotes/${quoteId}/items/${itemId}`, data)
  },

  deleteItem: (quoteId: string, itemId: string): Promise<void> => {
    return apiClient.delete(`/quotes/${quoteId}/items/${itemId}`)
  },

  validateAmounts: (quoteId: string): Promise<AmountCheckResult[]> => {
    return apiClient.get(`/quotes/${quoteId}/validate-amounts`)
  },
}
