import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatRelative(date: string | Date | undefined) {
  if (!date) return '-';
  return dayjs(date).fromNow();
}

export function formatMoney(amount: number | undefined | null, symbol = '¥') {
  if (amount === undefined || amount === null) return '-';
  return `${symbol}${amount.toFixed(2)}`;
}

export const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待分派', color: 'badge-gray' },
  ASSIGNED: { label: '已分派', color: 'badge-primary' },
  IN_PROGRESS: { label: '处理中', color: 'badge-warning' },
  VERIFIED: { label: '已核验', color: 'badge-primary' },
  COMPLETED: { label: '已完成', color: 'badge-success' },
  CANCELLED: { label: '已取消', color: 'badge-gray' },
  DAMAGED: { label: '物品损坏', color: 'badge-danger' },
};

export const RISK_LEVEL_MAP: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: '低风险', color: 'text-success-600', bg: 'bg-success-50 border-success-200' },
  MEDIUM: { label: '中风险', color: 'text-warning-600', bg: 'bg-warning-50 border-warning-200' },
  HIGH: { label: '高风险', color: 'text-danger-600', bg: 'bg-danger-50 border-danger-200' },
  CRITICAL: { label: '极高风险', color: 'text-critical', bg: 'bg-red-50 border-red-300' },
};

export const DAMAGE_STATUS_MAP: Record<string, { label: string; color: string }> = {
  REPORTED: { label: '已上报', color: 'badge-gray' },
  UNDER_REVIEW: { label: '复核中', color: 'badge-primary' },
  COMMUNICATING: { label: '沟通中', color: 'badge-warning' },
  REVIEW_CONFIRMED: { label: '复核确认', color: 'badge-primary' },
  RESOLVED: { label: '已解决', color: 'badge-success' },
  REJECTED: { label: '已驳回', color: 'badge-danger' },
};

export const VERIFICATION_STEP_MAP: Record<string, { label: string; icon: string }> = {
  PHOTO_UPLOADED: { label: '核验照片', icon: 'Camera' },
  TAG_REVIEWED: { label: '评价标签', icon: 'Tags' },
  ADDRESS_CHECKED: { label: '地址核对', icon: 'BadgeCheck' },
  TRACKING_CONFIRMED: { label: '轨迹追踪', icon: 'Route' },
  SUBSIDY_APPLIED: { label: '补贴规则', icon: 'Wallet' },
};

export const RIDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  OFFLINE: { label: '离线', color: 'text-gray-500' },
  IDLE: { label: '空闲', color: 'text-success-600' },
  ON_DELIVERY: { label: '配送中', color: 'text-primary-600' },
  ON_BREAK: { label: '休息', color: 'text-warning-600' },
};

export const USER_ROLE_MAP: Record<string, string> = {
  ADMIN: '系统管理员',
  MANAGER: '管理层',
  DISPATCHER: '调度员',
  VERIFIER: '核验员',
  RIDER: '骑手',
};
