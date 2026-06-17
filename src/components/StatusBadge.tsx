import { cn } from '@/lib/utils';
import type { BatchStatus, ShortageStatus, ShortagePriority } from '@/types';

interface StatusBadgeProps {
  status: BatchStatus | ShortageStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  in_stock: { label: '在库', className: 'badge-success' },
  in_use: { label: '领用中', className: 'badge-primary' },
  shortage: { label: '短缺', className: 'badge-danger' },
  closed: { label: '已完结', className: 'badge-secondary' },
  pending: { label: '待处理', className: 'badge-warning' },
  processing: { label: '处理中', className: 'badge-primary' },
  supplemented: { label: '已补录', className: 'badge-success' },
  retried: { label: '已重试', className: 'badge-primary' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'badge-secondary' };
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: ShortagePriority;
  className?: string;
}

const priorityConfig: Record<ShortagePriority, { label: string; className: string }> = {
  high: { label: '高优先级', className: 'badge-danger' },
  medium: { label: '中优先级', className: 'badge-warning' },
  low: { label: '低优先级', className: 'badge-secondary' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}

interface RecordTypeBadgeProps {
  type: 'in' | 'out' | 'transfer' | 'adjust';
  className?: string;
}

const recordTypeConfig: Record<string, { label: string; className: string }> = {
  in: { label: '入库', className: 'badge-success' },
  out: { label: '出库', className: 'badge-danger' },
  transfer: { label: '调拨', className: 'badge-primary' },
  adjust: { label: '调整', className: 'badge-warning' },
};

export function RecordTypeBadge({ type, className }: RecordTypeBadgeProps) {
  const config = recordTypeConfig[type];
  return (
    <span className={cn(config.className, className)}>
      {config.label}
    </span>
  );
}
