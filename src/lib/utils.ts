import { clsx, type ClassValue } from 'clsx';
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

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function getAttendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ATTENDED: '已到场',
    ABSENT: '未到场',
    POSTPONED: '已延期',
    CANCELLED: '已取消',
  };
  return labels[status] || status;
}

export function getAttendanceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ATTENDED: 'bg-accent-green text-white',
    ABSENT: 'bg-accent-red text-white',
    POSTPONED: 'bg-accent-amber text-white',
    CANCELLED: 'bg-gray-500 text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
}

export function getConflictStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '待处理',
    RESOLVED: '已解决',
    ESCALATED: '已升级',
  };
  return labels[status] || status;
}

export function getConflictStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-accent-amber text-white',
    RESOLVED: 'bg-accent-green text-white',
    ESCALATED: 'bg-accent-red text-white',
  };
  return colors[status] || 'bg-gray-500 text-white';
}

export function getDataSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    CASE_SYSTEM: '案件系统',
    CALENDAR_TOOL: '日历工具',
    EMAIL_ATTACHMENT: '邮件附件',
  };
  return labels[source] || source;
}

export function generateFilterHash(filters: Record<string, unknown>): string {
  return btoa(encodeURIComponent(JSON.stringify(filters)));
}

export function parseFilterHash(hash: string): Record<string, unknown> | null {
  try {
    return JSON.parse(decodeURIComponent(atob(hash)));
  } catch {
    return null;
  }
}

export function getTimeSlot(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 8 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '午间';
  if (hour >= 14 && hour < 18) return '下午';
  return '晚间';
}

export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
