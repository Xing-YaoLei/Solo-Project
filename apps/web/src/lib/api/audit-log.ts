import apiClient from './axios';
import type {
  OperationLog,
  UnauthorizedAccess,
  UnauthorizedSeverity,
  UnauthorizedStatus,
  OperationAction,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface OperationLogFilters {
  targetType?: string;
  action?: OperationAction;
  operatorId?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UnauthorizedFilters {
  userId?: string;
  resourceType?: string;
  severity?: UnauthorizedSeverity;
  status?: UnauthorizedStatus;
  startDate?: string;
  endDate?: string;
}

export interface HandleUnauthorizedRequest {
  status: UnauthorizedStatus;
  severity?: UnauthorizedSeverity;
  handlingNote?: string;
}

export interface AuditStats {
  operations: {
    total: number;
    byAction: { action: OperationAction; count: number }[];
    byTargetType: { targetType: string; count: number }[];
  };
  unauthorized: {
    total: number;
    pending: number;
    byStatus: { status: UnauthorizedStatus; count: number }[];
    bySeverity: { severity: UnauthorizedSeverity; count: number }[];
  };
}

export const auditLogApi = {
  getOperationLogs: async (
    params: PaginationParams & OperationLogFilters = {},
  ): Promise<PaginatedResult<OperationLog>> => {
    const { data } = await apiClient.get('/audit-log/operations', { params });
    return data;
  },

  getOperationLogsByTarget: async (
    targetType: string,
    targetId: string,
    params: PaginationParams = {},
  ): Promise<PaginatedResult<OperationLog>> => {
    const { data } = await apiClient.get('/audit-log/operations', {
      params: { targetType, taskId: targetType === 'AuditTask' ? targetId : undefined, ...params },
    });
    return data;
  },

  getUnauthorizedAccess: async (
    params: PaginationParams & UnauthorizedFilters = {},
  ): Promise<PaginatedResult<UnauthorizedAccess>> => {
    const { data } = await apiClient.get('/audit-log/unauthorized', { params });
    return data;
  },

  getUnauthorizedDetail: async (
    id: string,
  ): Promise<UnauthorizedAccess> => {
    const { data } = await apiClient.get(`/audit-log/unauthorized/${id}`);
    return data;
  },

  handleUnauthorized: async (
    id: string,
    data: HandleUnauthorizedRequest,
  ): Promise<UnauthorizedAccess> => {
    const res = await apiClient.patch(`/audit-log/unauthorized/${id}/handle`, data);
    return res.data;
  },

  getAuditStats: async (): Promise<AuditStats> => {
    const { data } = await apiClient.get('/audit-log/stats');
    return data;
  },
};
