import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}时${mins}分`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MM-dd HH:mm', { locale: zhCN })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `ORD${timestamp}${random}`
}

export function generateTransactionNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TXN${timestamp}${random}`
}

export function generateTicketNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `CS${timestamp}${random}`
}

export function getTaskTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    item_damage: '物品损坏',
    dispatch_timeout: '派单超时',
  }
  return labels[type] || type
}

export function getTaskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return labels[status] || status
}

export function getTaskPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  }
  return labels[priority] || priority
}

export function getPriorityLabel(priority: string): string {
  return getTaskPriorityLabel(priority)
}

export function getDamageLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    minor: '轻微',
    moderate: '中度',
    severe: '严重',
  }
  return labels[level] || level
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待接单',
    accepted: '已接单',
    picked: '已取货',
    delivered: '已送达',
    cancelled: '已取消',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    accepted: 'bg-blue-500/20 text-blue-400',
    picked: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    resolved: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
    processing: 'bg-blue-500/20 text-blue-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400'
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  }
  return colors[priority] || 'bg-gray-500/20 text-gray-400'
}

export function calculateDispatchDuration(acceptedAt: Date, pickedAt: Date): number {
  return Math.floor((pickedAt.getTime() - acceptedAt.getTime()) / 1000)
}

export function isDispatchTimeout(duration: number, threshold: number = 1800): boolean {
  return duration > threshold
}

export function getChartStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    subsidy_rules: '补贴规则',
    appeals: '申诉证据',
    settlements: '结算明细',
  }
  return labels[stage] || stage
}
