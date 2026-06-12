import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CleaningStatus, DeviceStatus, SourceChannel, CloseReason } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const STATUS_LABELS: Record<CleaningStatus, string> = {
  draft: '草稿',
  pending_review: '待复核',
  supplement_info: '补资料',
  reviewing: '复核中',
  completed: '已完成',
  closed: '已关闭',
}

export const STATUS_COLORS: Record<CleaningStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  supplement_info: 'bg-orange-100 text-orange-800',
  reviewing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-purple-100 text-purple-800',
}

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  maintenance: '维护中',
  unknown: '未知',
}

export const DEVICE_STATUS_COLORS: Record<DeviceStatus, string> = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-red-100 text-red-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  unknown: 'bg-gray-100 text-gray-800',
}

export const SOURCE_CHANNEL_LABELS: Record<SourceChannel, string> = {
  routine_inspection: '例行巡检',
  device_alert: '设备告警',
  manual_report: '人工上报',
  store_request: '门店申请',
}

export const CLOSE_REASON_LABELS: Record<CloseReason, string> = {
  qualified: '复核合格',
  device_replaced: '设备更换',
  point_closed: '点位关闭',
  other: '其他原因',
}

export function formatDateTime(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
