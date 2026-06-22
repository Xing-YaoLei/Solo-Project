import apiClient from './axios';
import type {
  Notification,
  NotificationTemplate,
  NotificationType,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  content?: string;
  recipientId: string;
  taskId?: string;
  evidenceId?: string;
  actionType?: string;
  actionUrl?: string;
}

export interface NotificationsFilters {
  type?: NotificationType;
  recipientId?: string;
  isRead?: boolean;
  taskId?: string;
}

export interface MarkReadRequest {
  notificationIds?: string[];
  all?: boolean;
}

export interface SendTemplatedRequest {
  templateId: string;
  recipientIds: string[];
  variables?: Record<string, string>;
  taskId?: string;
  evidenceId?: string;
}

export interface TemplateFilters {
  category?: string;
  isActive?: boolean;
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  subject: string;
  content: string;
  variables?: string[];
  isActive?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  category?: string;
  subject?: string;
  content?: string;
  variables?: string[];
  isActive?: boolean;
}

export const notificationsApi = {
  getMyNotifications: async (
    params: PaginationParams & NotificationsFilters = {},
  ): Promise<PaginatedResult<Notification>> => {
    const { data } = await apiClient.get('/notifications/mine', { params });
    return data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/mine/unread-count');
    return data;
  },

  markAsRead: async (data: MarkReadRequest): Promise<{ message: string }> => {
    const res = await apiClient.post('/notifications/mine/read', data);
    return res.data;
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/notifications/mine/${id}`);
    return data;
  },

  getAllNotifications: async (
    params: PaginationParams & NotificationsFilters = {},
  ): Promise<PaginatedResult<Notification>> => {
    const { data } = await apiClient.get('/notifications', { params });
    return data;
  },

  createNotification: async (
    data: CreateNotificationRequest,
  ): Promise<Notification> => {
    const res = await apiClient.post('/notifications', data);
    return res.data;
  },

  sendTemplatedNotification: async (
    data: SendTemplatedRequest,
  ): Promise<{ message: string; sentCount: number }> => {
    const res = await apiClient.post('/notifications/template/send', data);
    return res.data;
  },

  getTemplates: async (
    params: PaginationParams & TemplateFilters = {},
  ): Promise<PaginatedResult<NotificationTemplate>> => {
    const { data } = await apiClient.get('/notifications/templates', { params });
    return data;
  },

  getTemplate: async (id: string): Promise<NotificationTemplate> => {
    const { data } = await apiClient.get(`/notifications/templates/${id}`);
    return data;
  },

  createTemplate: async (
    data: CreateTemplateRequest,
  ): Promise<NotificationTemplate> => {
    const res = await apiClient.post('/notifications/templates', data);
    return res.data;
  },

  updateTemplate: async (
    id: string,
    data: UpdateTemplateRequest,
  ): Promise<NotificationTemplate> => {
    const res = await apiClient.patch(`/notifications/templates/${id}`, data);
    return res.data;
  },

  deleteTemplate: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/notifications/templates/${id}`);
    return data;
  },
};
