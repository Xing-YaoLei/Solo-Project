import apiClient from './axios';
import type {
  Checklist,
  ChecklistExecution,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface CreateChecklistRequest {
  title: string;
  description?: string;
  category?: string;
  version?: string;
  isActive?: boolean;
  items: {
    order: number;
    content: string;
    requirement?: string;
    evidenceNeeded?: boolean;
  }[];
}

export interface UpdateChecklistRequest {
  title?: string;
  description?: string;
  category?: string;
  version?: string;
  isActive?: boolean;
  items?: {
    order: number;
    content: string;
    requirement?: string;
    evidenceNeeded?: boolean;
  }[];
}

export interface ExecuteChecklistRequest {
  taskId: string;
}

export interface UpdateChecklistItemResultRequest {
  executionId: string;
  itemId: string;
  isPass?: boolean;
  remark?: string;
  evidenceId?: string;
}

export interface ChecklistFilters {
  category?: string;
  isActive?: boolean;
}

export interface ChecklistExecutionFilters {
  checklistId?: string;
  taskId?: string;
  executedById?: string;
}

export const checklistsApi = {
  getChecklists: async (
    params: PaginationParams & ChecklistFilters = {},
  ): Promise<PaginatedResult<Checklist>> => {
    const { data } = await apiClient.get('/checklists', { params });
    return data;
  },

  getChecklist: async (id: string): Promise<Checklist> => {
    const { data } = await apiClient.get(`/checklists/${id}`);
    return data;
  },

  createChecklist: async (
    data: CreateChecklistRequest,
  ): Promise<Checklist> => {
    const res = await apiClient.post('/checklists', data);
    return res.data;
  },

  updateChecklist: async (
    id: string,
    data: UpdateChecklistRequest,
  ): Promise<Checklist> => {
    const res = await apiClient.patch(`/checklists/${id}`, data);
    return res.data;
  },

  deleteChecklist: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/checklists/${id}`);
    return data;
  },

  executeChecklist: async (
    id: string,
    data: ExecuteChecklistRequest,
  ): Promise<ChecklistExecution> => {
    const res = await apiClient.post(`/checklists/${id}/execute`, data);
    return res.data;
  },

  updateChecklistItemResult: async (
    data: UpdateChecklistItemResultRequest,
  ): Promise<{ message: string }> => {
    const res = await apiClient.post('/checklists/result/update', data);
    return res.data;
  },

  getChecklistExecutions: async (
    params: PaginationParams & ChecklistExecutionFilters = {},
  ): Promise<PaginatedResult<ChecklistExecution>> => {
    const { data } = await apiClient.get('/checklists/executions', { params });
    return data;
  },
};
