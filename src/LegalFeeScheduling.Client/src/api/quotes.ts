import apiClient from './client'
import type {
  Quote,
  QuoteItem,
  QuoteFilter,
  PagedResult,
  CreateQuoteDto,
  UpdateQuoteDto,
  CreateQuoteItemDto,
  AmountCheckResult,
} from '../types'

export const quoteApi = {
  getQuotes: (filter: QuoteFilter): Promise<PagedResult<Quote>> => {
    return apiClient.get('/quotes', { params: filter })
  },

  getQuote: (id: string): Promise<Quote> => {
    return apiClient.get(`/quotes/${id}`)
  },

  getQuoteByNo: (quoteNo: string): Promise<Quote> => {
    return apiClient.get(`/quotes/no/${quoteNo}`)
  },

  createQuote: (data: CreateQuoteDto): Promise<Quote> => {
    return apiClient.post('/quotes', data)
  },

  updateQuote: (id: string, data: UpdateQuoteDto): Promise<Quote> => {
    return apiClient.put(`/quotes/${id}`, data)
  },

  deleteQuote: (id: string): Promise<void> => {
    return apiClient.delete(`/quotes/${id}`)
  },

  addQuoteItem: (quoteId: string, data: CreateQuoteItemDto): Promise<QuoteItem> => {
    return apiClient.post(`/quotes/${quoteId}/items`, data)
  },

  updateQuoteItem: (
    quoteId: string,
    itemId: string,
    data: CreateQuoteItemDto
  ): Promise<QuoteItem> => {
    return apiClient.put(`/quotes/${quoteId}/items/${itemId}`, data)
  },

  deleteQuoteItem: (quoteId: string, itemId: string): Promise<void> => {
    return apiClient.delete(`/quotes/${quoteId}/items/${itemId}`)
  },

  validateAmounts: (quoteId: string): Promise<AmountCheckResult[]> => {
    return apiClient.get(`/quotes/${quoteId}/validate-amounts`)
  },
}
