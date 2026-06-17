import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import { OrderStatus, OrderSource, DelayReason, ReviewTag } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: '待分派',
  [OrderStatus.ASSIGNED]: '已分派',
  [OrderStatus.IN_PROGRESS]: '处理中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.PENDING_SUPPLEMENT]: '待补料',
  [OrderStatus.UNDER_REVIEW]: '复核中',
  [OrderStatus.CLOSED]: '已关闭',
};

export const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: 'bg-gray-100 text-gray-800',
  [OrderStatus.ASSIGNED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [OrderStatus.PENDING_SUPPLEMENT]: 'bg-orange-100 text-orange-800',
  [OrderStatus.UNDER_REVIEW]: 'bg-purple-100 text-purple-800',
  [OrderStatus.CLOSED]: 'bg-gray-100 text-gray-600',
};

export const sourceLabels: Record<OrderSource, string> = {
  [OrderSource.PHONE]: '电话报修',
  [OrderSource.APP]: 'APP报修',
  [OrderSource.WECHAT]: '微信报修',
  [OrderSource.WALK_IN]: '上门报修',
  [OrderSource.MAINTENANCE_TEAM]: '巡检发现',
};

export const delayReasonLabels: Record<DelayReason, string> = {
  [DelayReason.TRAFFIC]: '交通拥堵',
  [DelayReason.MATERIAL_SHORTAGE]: '材料短缺',
  [DelayReason.PREVIOUS_TASK_OVERRUN]: '上一任务超时',
  [DelayReason.PERSONNEL_ISSUE]: '人员问题',
  [DelayReason.WEATHER]: '天气原因',
  [DelayReason.OTHER]: '其他原因',
};

export const reviewTagLabels: Record<ReviewTag, string> = {
  [ReviewTag.ON_TIME]: '准时完成',
  [ReviewTag.DELAYED]: '存在延误',
  [ReviewTag.HIGH_QUALITY]: '质量优秀',
  [ReviewTag.NEEDS_IMPROVEMENT]: '待改进',
  [ReviewTag.CUSTOMER_COMPLAINT]: '客户投诉',
  [ReviewTag.EXCELLENT_SERVICE]: '服务优秀',
};

export const reviewTagColors: Record<ReviewTag, string> = {
  [ReviewTag.ON_TIME]: 'bg-green-100 text-green-700',
  [ReviewTag.DELAYED]: 'bg-red-100 text-red-700',
  [ReviewTag.HIGH_QUALITY]: 'bg-blue-100 text-blue-700',
  [ReviewTag.NEEDS_IMPROVEMENT]: 'bg-yellow-100 text-yellow-700',
  [ReviewTag.CUSTOMER_COMPLAINT]: 'bg-red-100 text-red-700',
  [ReviewTag.EXCELLENT_SERVICE]: 'bg-purple-100 text-purple-700',
};

export const priorityLabels: Record<number, string> = {
  1: '普通',
  2: '紧急',
  3: '特急',
};

export const priorityColors: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-red-100 text-red-700',
};
