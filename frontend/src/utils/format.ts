import type {
  CleaningStatus,
  AttendanceStatus,
  RiskLevel,
  UserRole,
  RescheduleReason,
} from '@/types';
import clsx from 'clsx';

export const STATUS_LABELS: Record<CleaningStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  rescheduled: '已改约',
  no_show: '未到场',
};

export const STATUS_COLORS: Record<CleaningStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
  rescheduled: 'bg-indigo-100 text-indigo-800',
  no_show: 'bg-red-100 text-red-800',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  not_started: '未开始',
  en_route: '已出发',
  arrived: '已到场',
  checked_out: '已离场',
};

export const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  not_started: 'bg-gray-100 text-gray-600',
  en_route: 'bg-blue-100 text-blue-800',
  arrived: 'bg-green-100 text-green-800',
  checked_out: 'bg-purple-100 text-purple-800',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  low: 'bg-green-50 border-l-4 border-l-green-400',
  medium: 'bg-yellow-50 border-l-4 border-l-yellow-400',
  high: 'bg-orange-50 border-l-4 border-l-orange-400',
  critical: 'bg-red-50 border-l-4 border-l-red-400',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  supervisor: '调度主管',
  cleaner: '保洁员',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  supervisor: 'bg-purple-100 text-purple-800',
  cleaner: 'bg-teal-100 text-teal-800',
};

export const RESCHEDULE_REASON_LABELS: Record<RescheduleReason, string> = {
  customer_request: '客户要求',
  staff_unavailable: '人员不可用',
  conflict: '时段冲突',
  apartment_unavailable: '公寓不可用',
  other: '其他原因',
};

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function cn(...inputs: any[]): string {
  return clsx(...inputs);
}

export const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function getWeekDates(base: Date = new Date()): Date[] {
  const result: Date[] = [];
  const d = new Date(base);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  for (let i = 0; i < 7; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() + i);
    result.push(date);
  }
  return result;
}

export function getMonthDates(year: number, month: number): Date[] {
  const result: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = (firstDay.getDay() + 6) % 7;
  for (let i = startPadding - 1; i >= 0; i--) {
    result.push(new Date(year, month, -i));
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    result.push(new Date(year, month, i));
  }
  const remaining = 42 - result.length;
  for (let i = 1; i <= remaining; i++) {
    result.push(new Date(year, month + 1, i));
  }
  return result;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function toDateTimeInputValue(date: Date): string {
  const iso = date.toISOString();
  return iso.substring(0, 16);
}
