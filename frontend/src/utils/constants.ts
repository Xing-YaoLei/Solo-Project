import type { WorkOrderStatus, WorkOrderPriority, WorkOrderCategory } from '@/types';

export const statusLabels: Record<WorkOrderStatus, string> = {
  pending: '待派工',
  assigned: '已派工',
  in_progress: '处理中',
  completed: '已完成',
  reviewing: '复核中',
  review_failed: '复核不通过',
  closed: '已结案',
};

export const statusColors: Record<WorkOrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  reviewing: 'bg-purple-100 text-purple-800',
  review_failed: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-800',
};

export const priorityLabels: Record<WorkOrderPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const priorityColors: Record<WorkOrderPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export const categoryLabels: Record<WorkOrderCategory, string> = {
  electrical: '电气类',
  plumbing: '水暖类',
  hvac: '空调类',
  civil: '土建类',
  cleaning: '保洁类',
  security: '安保类',
  other: '其他',
};

export const categoryColors: Record<WorkOrderCategory, string> = {
  electrical: 'bg-yellow-500',
  plumbing: 'bg-blue-500',
  hvac: 'bg-cyan-500',
  civil: 'bg-amber-600',
  cleaning: 'bg-green-500',
  security: 'bg-indigo-500',
  other: 'bg-gray-500',
};

export const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  manager: '管理人员',
  worker: '一线人员',
};
