import apiClient from './axios';
import type {
  DashboardStats,
  TaskStats,
  EvidenceStats,
  IssueStats,
  ReviewStats,
  UserStats,
  DrillDownResult,
  RecurrenceTrendItem,
  AuditType,
  EvidenceCategory,
  IssueSeverity,
} from './types';

export interface DateFilters {
  startDate?: string;
  endDate?: string;
}

export interface TaskStatsFilters extends DateFilters {
  department?: string;
  auditType?: AuditType;
}

export interface EvidenceStatsFilters extends DateFilters {
  category?: EvidenceCategory;
  taskId?: string;
}

export interface IssueStatsFilters extends DateFilters {
  category?: string;
  department?: string;
  severity?: IssueSeverity;
}

export const statisticsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/statistics/dashboard');
    return data;
  },

  getTaskStats: async (
    filters?: TaskStatsFilters,
  ): Promise<TaskStats> => {
    const { data } = await apiClient.get('/statistics/tasks', {
      params: filters,
    });
    return data;
  },

  getEvidenceStats: async (
    filters?: EvidenceStatsFilters,
  ): Promise<EvidenceStats> => {
    const { data } = await apiClient.get('/statistics/evidences', {
      params: filters,
    });
    return data;
  },

  getIssueStats: async (
    filters?: IssueStatsFilters,
  ): Promise<IssueStats> => {
    const { data } = await apiClient.get('/statistics/issues', {
      params: filters,
    });
    return data;
  },

  getReviewStats: async (
    filters?: DateFilters,
  ): Promise<ReviewStats> => {
    const { data } = await apiClient.get('/statistics/reviews', {
      params: filters,
    });
    return data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const { data } = await apiClient.get('/statistics/users');
    return data;
  },

  getRecurrenceTrend: async (
    months: number = 6,
  ): Promise<RecurrenceTrendItem[]> => {
    const { data } = await apiClient.get('/statistics/issues/recurrence-trend', {
      params: { months },
    });
    return data;
  },

  drillDown: async (
    dimension: string,
    value: string,
    filters?: DateFilters,
  ): Promise<DrillDownResult> => {
    const { data } = await apiClient.get('/statistics/drill-down', {
      params: { dimension, value, ...filters },
    });
    return data;
  },
};
