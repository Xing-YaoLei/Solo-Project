import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatMoney(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('zh-CN').format(num)
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    OVERDUE: 'bg-red-100 text-red-800',
    REASSIGNED: 'bg-purple-100 text-purple-800',
    ACTIVE: 'bg-green-100 text-green-800',
    VACANT: 'bg-gray-100 text-gray-800',
    OCCUPIED: 'bg-green-100 text-green-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
    LISTING: 'bg-blue-100 text-blue-800',
    DELISTED: 'bg-gray-100 text-gray-600',
    DRAFT: 'bg-gray-100 text-gray-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
    TERMINATED: 'bg-red-100 text-red-800',
    PENDING_RENEWAL: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    OPEN: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-orange-100 text-orange-800',
    LOW: 'bg-gray-100 text-gray-800',
    URGENT: 'bg-red-600 text-white',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: '待处理',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    REJECTED: '已驳回',
    OVERDUE: '已逾期',
    REASSIGNED: '已转派',
    ACTIVE: '有效',
    VACANT: '空置',
    OCCUPIED: '已出租',
    MAINTENANCE: '维修中',
    LISTING: '上架中',
    DELISTED: '已下架',
    DRAFT: '草稿',
    EXPIRED: '已过期',
    TERMINATED: '已终止',
    PENDING_RENEWAL: '待续签',
    PAID: '已支付',
    CANCELLED: '已取消',
    OPEN: '待处理',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
    URGENT: '紧急',
    PROPERTY_LISTING: '房源上架',
    RENT_OVERDUE: '租金逾期',
    MAINTENANCE: '维修工单',
    CONTRACT_REVIEW: '合同审核',
    UTILITY_READING: '水电读数',
  }
  return labels[status] || status
}

export function truncateText(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}
