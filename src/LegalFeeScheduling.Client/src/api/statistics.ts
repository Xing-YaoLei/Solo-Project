import apiClient from './client'
import {
  StatisticsSummary,
  ChannelStatistics,
  AmountCheckResult,
  OwnerStatistics,
  PeriodSummaryDto,
  StatusChangeSummaryDto,
  PaymentCollectionDto,
  AmountCheckRecord,
} from '../types'

export const statisticsApi = {
  getSummary: (): Promise<StatisticsSummary> => {
    return apiClient.get('/statistics/summary')
  },

  getByChannel: (): Promise<ChannelStatistics[]> => {
    return apiClient.get('/statistics/by-channel')
  },

  getByOwner: (): Promise<OwnerStatistics[]> => {
    return apiClient.get('/statistics/by-owner')
  },

  getPeriodSummary: (params?: {
    startDate?: string
    endDate?: string
    period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  }): Promise<PeriodSummaryDto[]> => {
    return apiClient.get('/statistics/period-summary', { params })
  },

  getStatusChangeSummary: (params?: {
    startDate?: string
    endDate?: string
  }): Promise<StatusChangeSummaryDto[]> => {
    return apiClient.get('/statistics/status-change', { params })
  },

  getPaymentCollectionAnalysis: (params?: {
    startDate?: string
    endDate?: string
  }): Promise<PaymentCollectionDto> => {
    return apiClient.get('/statistics/payment-collection', { params })
  },

  checkQuoteAmount: (quoteId: string): Promise<AmountCheckResult> => {
    return apiClient.get(`/statistics/amount-check/${quoteId}`)
  },

  runAmountChecks: (quoteId: string): Promise<AmountCheckRecord[]> => {
    return apiClient.post(`/statistics/run-checks/${quoteId}`)
  },

  getUnbalancedQuotes: (): Promise<AmountCheckResult[]> => {
    return apiClient.get('/statistics/unbalanced-quotes')
  },
}
