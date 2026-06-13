import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { RefundStatus, ResponsibilityParty, TimelineAction, UserRole } from '@solo/shared';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export { dayjs };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string | Date | null | undefined, format: string = 'YYYY-MM-DD HH:mm') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

export const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes}分钟`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}小时`;
  return `${Math.round(minutes / 1440)}天`;
};

export const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toFixed(2)}`;
};

export const statusConfig: Record<RefundStatus, { label: string; color: string; bgColor: string }> = {
  [RefundStatus.PENDING]: { label: '待分配', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  [RefundStatus.ASSIGNED]: { label: '已分配', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  [RefundStatus.PROCESSING]: { label: '处理中', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  [RefundStatus.EVIDENCE_UPLOADED]: { label: '已上传凭证', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  [RefundStatus.REVIEWING]: { label: '审核中', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  [RefundStatus.APPROVED]: { label: '已通过', color: 'text-green-700', bgColor: 'bg-green-100' },
  [RefundStatus.REJECTED]: { label: '已拒绝', color: 'text-red-700', bgColor: 'bg-red-100' },
  [RefundStatus.RETRY]: { label: '需重试', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  [RefundStatus.SUPPLEMENT]: { label: '需补录', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  [RefundStatus.CLOSED]: { label: '已关闭', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  [RefundStatus.TIMEOUT]: { label: '已超时', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const responsibilityConfig: Record<ResponsibilityParty, { label: string; color: string }> = {
  [ResponsibilityParty.PLATFORM]: { label: '平台', color: 'bg-blue-500' },
  [ResponsibilityParty.MERCHANT]: { label: '商家', color: 'bg-green-500' },
  [ResponsibilityParty.LOGISTICS]: { label: '物流', color: 'bg-yellow-500' },
  [ResponsibilityParty.CUSTOMER]: { label: '客户', color: 'bg-purple-500' },
  [ResponsibilityParty.SUPPLIER]: { label: '供应商', color: 'bg-orange-500' },
  [ResponsibilityParty.OTHER]: { label: '其他', color: 'bg-gray-500' },
};

export const actionConfig: Record<TimelineAction, { label: string; icon: string }> = {
  [TimelineAction.CREATED]: { label: '创建工单', icon: 'Plus' },
  [TimelineAction.ASSIGNED]: { label: '分配处理', icon: 'UserPlus' },
  [TimelineAction.STATUS_CHANGED]: { label: '状态变更', icon: 'RefreshCw' },
  [TimelineAction.EVIDENCE_UPLOADED]: { label: '上传凭证', icon: 'Upload' },
  [TimelineAction.EVIDENCE_DELETED]: { label: '删除凭证', icon: 'Trash2' },
  [TimelineAction.RETRY_REQUESTED]: { label: '申请重试', icon: 'RotateCcw' },
  [TimelineAction.SUPPLEMENT_REQUESTED]: { label: '要求补录', icon: 'FileText' },
  [TimelineAction.RESPONSIBILITY_ASSIGNED]: { label: '责任判定', icon: 'Shield' },
  [TimelineAction.NOTE_ADDED]: { label: '添加备注', icon: 'MessageSquare' },
  [TimelineAction.TIMEOUT_WARNING]: { label: '超时预警', icon: 'AlertTriangle' },
  [TimelineAction.TIMEOUT]: { label: '处理超时', icon: 'Clock' },
  [TimelineAction.CLOSED]: { label: '关闭工单', icon: 'CheckCircle' },
  [TimelineAction.REOPENED]: { label: '重新打开', icon: 'Unlock' },
};

export const roleConfig: Record<UserRole, { label: string; color: string }> = {
  [UserRole.ADMIN]: { label: '管理员', color: 'text-red-600' },
  [UserRole.MANAGER]: { label: '经理', color: 'text-purple-600' },
  [UserRole.OPERATOR]: { label: '客服', color: 'text-blue-600' },
  [UserRole.VIEWER]: { label: '查看者', color: 'text-gray-600' },
};

export const getDeadlineStatus = (deadline: string | Date, isTimeout: boolean) => {
  if (isTimeout) return { status: 'timeout', label: '已超时', color: 'text-red-600' };
  
  const now = dayjs();
  const dl = dayjs(deadline);
  const diffHours = dl.diff(now, 'hour');
  
  if (diffHours < 0) return { status: 'timeout', label: '已超时', color: 'text-red-600' };
  if (diffHours < 4) return { status: 'urgent', label: `${diffHours}小时后超时`, color: 'text-orange-600' };
  if (diffHours < 24) return { status: 'warning', label: `${Math.round(diffHours)}小时内`, color: 'text-yellow-600' };
  return { status: 'normal', label: `${Math.round(diffHours / 24)}天内`, color: 'text-green-600' };
};
