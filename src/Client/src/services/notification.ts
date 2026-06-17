import request from '@/utils/request'
import type {
  NotificationRecord,
  NotificationQuery,
  PagedResult
} from '@/types'

export function getNotificationList(params: NotificationQuery): Promise<PagedResult<NotificationRecord>> {
  return request.get('/Notification', { params })
}

export function getNotificationDetail(id: number): Promise<NotificationRecord> {
  return request.get(`/Notification/${id}`)
}

export function markAsRead(id: number): Promise<void> {
  return request.put(`/Notification/${id}/read`)
}

export function markAllAsRead(): Promise<void> {
  return request.put('/Notification/read-all')
}

export function getUnreadCount(): Promise<number> {
  return request.get('/Notification/unread-count')
}

export function deleteNotification(id: number): Promise<void> {
  return request.delete(`/Notification/${id}`)
}
