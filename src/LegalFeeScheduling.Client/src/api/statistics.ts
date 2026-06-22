import apiClient from './client'
import type {
  DashboardSummaryDto,
  PeriodSummaryDto,
  ChannelStatisticsDto,
  OwnerStatisticsDto,
  StatusChangeSummaryDto,
  PaymentCollectionDto,
  AmountCheckResult,
} from '../types'

export const statisticsApi = {
  getDashboard: (): Promise<DashboardSummaryDto> => {
    return apiClient.get('/statistics/dashboard')
  },

  getPeriodSummary: (period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<PeriodSummaryDto> => {
    return apiClient.get('/statistics/summary', { params: { period } })
  },

  getByChannel: (): Promise<ChannelStatisticsDto[]> => {
    return apiClient.get('/statistics/by-channel')
  },

  getByOwner: (): Promise<OwnerStatisticsDto[]> => {
    return apiClient.get('/statistics/by-owner')
  },

  getStatusChanges: (days?: number): Promise<StatusChangeSummaryDto> => {
    return apiClient.get('/statistics/status-changes', { params: { days } })
  },

  getPaymentCollection: (): Promise<PaymentCollectionDto> => {
    return apiClient.get('/statistics/payment-collection')
  },

  getUnbalancedQuotes: (): Promise<AmountCheckResult[]> => {
    return apiClient.get('/statistics/unbalanced-quotes')
  },
}
