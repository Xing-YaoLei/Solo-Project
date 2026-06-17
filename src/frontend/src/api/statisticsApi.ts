import { api } from './axios'
import { StatisticsOverview, PaymentCycle, ProjectPerformance, AmountInconsistency } from '@/types/statistics'

export const statisticsApi = {
  getOverview: () => 
    api.get<StatisticsOverview>('/statistics/overview'),
  
  getPaymentCycles: (params?: { startDate?: string; endDate?: string }) => 
    api.get<PaymentCycle[]>('/statistics/payment-cycles', { params }),
  
  getProjectPerformance: (params?: { projectId?: string; startDate?: string; endDate?: string }) => 
    api.get<ProjectPerformance[]>('/statistics/project-performance', { params }),
  
  getAmountInconsistencies: (params?: { status?: string; startDate?: string; endDate?: string }) => 
    api.get<AmountInconsistency[]>('/statistics/amount-inconsistencies', { params }),
}
