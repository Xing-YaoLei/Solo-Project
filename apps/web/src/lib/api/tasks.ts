import apiClient from './axios';
import type {
  AuditTask,
  TaskStatus,
  TaskPriority,
  AuditType,
  PaginationParams,
  PaginatedResult,
  KanbanData,
} from './types';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  auditType?: AuditType;
  assignedToId?: string;
  createdById?: string;
  businessOwnerId?: string;
  department?: string;
  auditPeriod?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  auditType: AuditType;
  priority?: TaskPriority;
  department?: string;
  auditPeriod?: string;
  assignedToId?: string;
  businessOwnerId?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  department?: string;
  auditPeriod?: string;
  assignedToId?: string;
  businessOwnerId?: string;
  dueDate?: string;
}

export interface AssignTaskRequest {
  assignedToId: string;
  businessOwnerId?: string;
  dueDate?: string;
}

export interface BatchUpdateRequest {
  taskIds: string[];
  status?: TaskStatus;
  assignedToId?: string;
  priority?: TaskPriority;
}

export interface BatchUpdateResult {
  message: string;
  updatedCount: number;
  results: any[];
}

export const tasksApi = {
  getTasks: async (
    params: PaginationParams & TaskFilters = {},
  ): Promise<PaginatedResult<AuditTask>> => {
    const { data } = await apiClient.get('/tasks', { params });
    return data;
  },

  getTask: async (id: string): Promise<AuditTask> => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data;
  },

  createTask: async (data: CreateTaskRequest): Promise<AuditTask> => {
    const res = await apiClient.post('/tasks', data);
    return res.data;
  },

  updateTask: async (id: string, data: UpdateTaskRequest): Promise<AuditTask> => {
    const res = await apiClient.patch(`/tasks/${id}`, data);
    return res.data;
  },

  deleteTask: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/tasks/${id}`);
    return data;
  },

  assignTask: async (id: string, data: AssignTaskRequest): Promise<AuditTask> => {
    const res = await apiClient.post(`/tasks/${id}/assign`, data);
    return res.data;
  },

  batchUpdateTasks: async (data: BatchUpdateRequest): Promise<BatchUpdateResult> => {
    const res = await apiClient.post('/tasks/batch', data);
    return res.data;
  },

  getKanban: async (): Promise<KanbanData> => {
    const { data } = await apiClient.get('/tasks/kanban');
    return data;
  },

  getTaskStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/tasks/stats');
    return data;
  },
};
