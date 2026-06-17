import { get } from '@/utils/request'
import type { RepairDurationAnalysisDto, RepairRecordDto } from '@/types'

export interface AnalysisQueryParams {
  startDate?: string
  endDate?: string
  category?: string
  staffId?: string
}

export const analysisApi = {
  getRepairDuration: (params?: AnalysisQueryParams): Promise<RepairDurationAnalysisDto[]> => {
    return get<RepairDurationAnalysisDto[]>('/analysis/repair-duration', { params })
  },

  getRepairRecords: (params?: AnalysisQueryParams): Promise<RepairRecordDto[]> => {
    return get<RepairRecordDto[]>('/analysis/repair-records', { params })
  },

  getOrderStats: (params?: AnalysisQueryParams): Promise<{
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    averageDurationHours: number
    totalDeduction: number
    totalRefund: number
  }> => {
    return get('/analysis/order-stats', { params })
  },

  getTodoStats: (params?: AnalysisQueryParams): Promise<{
    totalTodos: number
    pendingTodos: number
    inProgressTodos: number
    completedTodos: number
    overdueTodos: number
    averageCompletionHours: number
  }> => {
    return get('/analysis/todo-stats', { params })
  },

  getStatusDistribution: (params?: AnalysisQueryParams): Promise<{ status: number; count: number }[]> => {
    return get('/analysis/status-distribution', { params })
  },

  getMonthlyTrend: (params?: AnalysisQueryParams): Promise<{ month: string; orderCount: number; completedCount: number }[]> => {
    return get('/analysis/monthly-trend', { params })
  },
}

export default analysisApi
