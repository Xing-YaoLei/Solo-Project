import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD') {
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date, format: string = 'YYYY-MM-DD HH:mm') {
  return dayjs(date).format(format)
}

export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    checked_in: '已签到',
    cancelled: '已取消',
    rescheduled: '已改约',
    conflict: '有冲突',
  }
  return statusMap[status] || status
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    rescheduled: 'bg-purple-100 text-purple-800',
    conflict: 'bg-red-100 text-red-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

export function getConflictStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    detected: '已检测',
    assigned: '已分配',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return statusMap[status] || status
}

export function getConflictStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    detected: 'bg-red-100 text-red-800',
    assigned: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

export function getSeverityLabel(severity: string): string {
  const severityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }
  return severityMap[severity] || severity
}

export function getSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }
  return colorMap[severity] || 'bg-gray-100 text-gray-800'
}

export function getTimelineEventTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    created: '创建预约',
    status_changed: '状态变更',
    note_added: '添加备注',
    attachment_added: '添加附件',
    rescheduled: '改约',
    conflict_detected: '冲突检测',
    conflict_resolved: '冲突解决',
    handover: '任务交接',
    remark: '补充说明',
  }
  return typeMap[type] || type
}

export function getTimelineEventTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    created: 'bg-green-500',
    status_changed: 'bg-blue-500',
    note_added: 'bg-purple-500',
    attachment_added: 'bg-indigo-500',
    rescheduled: 'bg-orange-500',
    conflict_detected: 'bg-red-500',
    conflict_resolved: 'bg-green-500',
    handover: 'bg-yellow-500',
    remark: 'bg-gray-500',
  }
  return colorMap[type] || 'bg-gray-500'
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('没有可导出的数据')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const cell = String(row[header] ?? '')
          return `"${cell.replace(/"/g, '""')}"`
        })
        .join(',')
    ),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename.replace('.xlsx', '.csv'))
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
