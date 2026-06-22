import { create } from 'zustand';
import type { Notification } from '@/lib/api/types';
import { notificationsApi } from '@/lib/api/notifications';

interface NotificationsState {
  unreadCount: number;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: (params?: { page?: number; pageSize?: number }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  decrementUnreadCount: () => void;
  clearError: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isLoading: false,
  error: null,

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      set({ unreadCount: count || 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取未读数量失败';
      set({ error: message });
    }
  },

  fetchNotifications: async (params?: { page?: number; pageSize?: number }) => {
    set({ isLoading: true, error: null });
    try {
      const result = await notificationsApi.getMyNotifications({
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
      });
      set({ notifications: result.items || [], isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取通知列表失败';
      set({ error: message, isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsApi.markAsRead({ notificationIds: [id] });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记已读失败';
      set({ error: message });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAsRead({ all: true });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '标记全部已读失败';
      set({ error: message });
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      const { notifications, unreadCount } = get();
      const deleted = notifications.find((n) => n.id === id);
      set({
        notifications: notifications.filter((n) => n.id !== id),
        unreadCount: deleted?.isRead ? unreadCount : Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除通知失败';
      set({ error: message });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  decrementUnreadCount: () => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));
