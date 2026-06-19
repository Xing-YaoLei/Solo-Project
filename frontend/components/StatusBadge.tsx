import { cn } from '@/lib/utils';

type StatusType =
  | 'pending'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'approved'
  | 'rejected'
  | 'fulfilled'
  | 'active'
  | 'passed'
  | 'failed';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: '待处理',
    className: 'bg-amber-100 text-amber-800',
  },
  inProgress: {
    label: '进行中',
    className: 'bg-blue-100 text-blue-800',
  },
  completed: {
    label: '已完成',
    className: 'bg-green-100 text-green-800',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-slate-100 text-slate-800',
  },
  approved: {
    label: '已批准',
    className: 'bg-green-100 text-green-800',
  },
  rejected: {
    label: '已拒绝',
    className: 'bg-red-100 text-red-800',
  },
  fulfilled: {
    label: '已完成',
    className: 'bg-green-100 text-green-800',
  },
  active: {
    label: '生效中',
    className: 'bg-green-100 text-green-800',
  },
  passed: {
    label: '通过',
    className: 'bg-green-100 text-green-800',
  },
  failed: {
    label: '未通过',
    className: 'bg-red-100 text-red-800',
  },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {label || config.label}
    </span>
  );
}

export default StatusBadge;
