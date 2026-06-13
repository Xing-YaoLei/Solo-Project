import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function generateBatchNo(type: string): string {
  const prefix = type.charAt(0);
  const timestamp = format(new Date(), 'yyyyMMddHHmmss');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    CREATED: 'bg-gray-100 text-gray-700',
    IN_SERVICE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    PAID: 'bg-accent-100 text-accent-700',
    REVIEWED: 'bg-primary-100 text-primary-700',
    PENDING: 'bg-gray-100 text-gray-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    COMPLETED_BATCH: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    PAID_TRANS: 'bg-green-100 text-green-700',
    REFUNDED: 'bg-red-100 text-red-700',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    CREATED: '已开单',
    IN_SERVICE: '服务中',
    COMPLETED: '已完成',
    PAID: '已支付',
    REVIEWED: '已点评',
    PENDING: '待处理',
    PROCESSING: '处理中',
    COMPLETED_BATCH: '已完成',
    FAILED: '失败',
    PAID_TRANS: '已支付',
    REFUNDED: '已退款',
  };
  return textMap[status] || status;
}

export function getBatchTypeText(type: string): string {
  const textMap: Record<string, string> = {
    INVENTORY: '库存表',
    TRANSACTION: '收银流水',
    REVIEW: '点评记录',
  };
  return textMap[type] || type;
}
