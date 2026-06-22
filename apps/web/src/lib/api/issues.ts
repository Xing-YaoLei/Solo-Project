import apiClient from './axios';
import type {
  Issue,
  IssueStatus,
  IssueSeverity,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface IssueFilters {
  status?: IssueStatus;
  severity?: IssueSeverity;
  taskId?: string;
  evidenceId?: string;
  category?: string;
  department?: string;
  isRecurred?: boolean;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  severity: IssueSeverity;
  status?: IssueStatus;
  taskId?: string;
  evidenceId?: string;
  samplingItemId?: string;
  parentIssueId?: string;
  category?: string;
  subCategory?: string;
  department?: string;
  dueDate?: string;
  ownerId?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  category?: string;
  subCategory?: string;
  department?: string;
  dueDate?: string;
  resolvedAt?: string;
  ownerId?: string;
}

export const issuesApi = {
  getIssues: async (
    params: PaginationParams & IssueFilters = {},
  ): Promise<PaginatedResult<Issue>> => {
    const { data } = await apiClient.get('/issues', { params });
    return data;
  },

  getIssue: async (id: string): Promise<Issue> => {
    const { data } = await apiClient.get(`/issues/${id}`);
    return data;
  },

  createIssue: async (data: CreateIssueRequest): Promise<Issue> => {
    const res = await apiClient.post('/issues', data);
    return res.data;
  },

  updateIssue: async (
    id: string,
    data: UpdateIssueRequest,
  ): Promise<Issue> => {
    const res = await apiClient.patch(`/issues/${id}`, data);
    return res.data;
  },

  deleteIssue: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/issues/${id}`);
    return data;
  },

  markRecurred: async (
    id: string,
    parentIssueId: string,
  ): Promise<Issue> => {
    const { data } = await apiClient.post(`/issues/${id}/recur`, {
      parentIssueId,
    });
    return data;
  },
};
