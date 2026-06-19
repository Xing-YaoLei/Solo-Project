import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRiskLevelClass(level: string): string {
  switch (level) {
    case 'CRITICAL':
      return 'risk-critical';
    case 'HIGH':
      return 'risk-high';
    case 'MEDIUM':
      return 'risk-medium';
    default:
      return 'risk-low';
  }
}

export function getRiskLevelText(level: string): string {
  switch (level) {
    case 'CRITICAL':
      return '紧急';
    case 'HIGH':
      return '高风险';
    case 'MEDIUM':
      return '中风险';
    default:
      return '低风险';
  }
}

export function getStatusText(status: string, type?: string): string {
  const statusMap: Record<string, Record<string, string>> = {
    order: {
      PENDING: '待确认',
      CONFIRMED: '已确认',
      CHECKED_IN: '已入住',
      CHECKED_OUT: '已退房',
      CANCELLED: '已取消',
    },
    cleaning: {
      PENDING: '待分配',
      ASSIGNED: '已分配',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      INSPECTED: '已检查',
      FAILED: '不合格',
    },
    room: {
      AVAILABLE: '可用',
      OCCUPIED: '占用',
      CLEANING: '清洁中',
      MAINTENANCE: '维护中',
      BLOCKED: '锁定',
    },
    document: {
      PENDING: '待审核',
      UPLOADED: '已上传',
      VERIFIED: '已验证',
      REJECTED: '已拒绝',
    },
    deposit: {
      PENDING: '待支付',
      PAID: '已支付',
      REFUNDED: '已退还',
      DEDUCTED: '已扣除',
      PARTIAL_REFUNDED: '部分退还',
    },
    conflict: {
      OPEN: '待处理',
      IN_PROGRESS: '处理中',
      RESOLVED: '已解决',
      CLOSED: '已关闭',
    },
  };

  return statusMap[type || 'order']?.[status] || status;
}

export function getStatusClass(status: string, type?: string): string {
  const classMap: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    CHECKED_IN: 'bg-green-100 text-green-800',
    CHECKED_OUT: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    OCCUPIED: 'bg-blue-100 text-blue-800',
    CLEANING: 'bg-yellow-100 text-yellow-800',
    MAINTENANCE: 'bg-gray-100 text-gray-800',
    BLOCKED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    RESOLVED: 'bg-green-100 text-green-800',
    PAID: 'bg-green-100 text-green-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-blue-100 text-blue-800',
  };

  return classMap[status] || 'bg-gray-100 text-gray-800';
}
