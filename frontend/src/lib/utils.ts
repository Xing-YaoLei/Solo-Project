import type { VerificationStatus } from '../types'
import { STATUS_LABELS } from '../types'

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export function getStatusLabel(status: VerificationStatus): string {
  return STATUS_LABELS[status] || status
}

export function getStatusColor(status: VerificationStatus): string {
  const colors: Record<VerificationStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-blue-100 text-blue-800',
    disputed: 'bg-red-100 text-red-800',
    supplementing: 'bg-orange-100 text-orange-800',
    escalated: 'bg-purple-100 text-purple-800',
    closed_normal: 'bg-green-100 text-green-800',
    closed_dispute: 'bg-slate-100 text-slate-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusDotColor(status: VerificationStatus): string {
  const colors: Record<VerificationStatus, string> = {
    pending: 'bg-amber-500',
    in_progress: 'bg-blue-500',
    disputed: 'bg-red-500',
    supplementing: 'bg-orange-500',
    escalated: 'bg-purple-500',
    closed_normal: 'bg-green-500',
    closed_dispute: 'bg-slate-500',
  }
  return colors[status] || 'bg-gray-500'
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
