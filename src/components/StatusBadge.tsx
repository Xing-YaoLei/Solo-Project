import type { Complaint } from '@/types';

interface StatusBadgeProps {
  status: Complaint['status'];
}

const statusConfig: Record<Complaint['status'], { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  processing: { label: '处理中', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  escalated: { label: '已升级', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  resolved: { label: '已解决', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  closed: { label: '已关闭', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: Complaint['severity'];
}

const severityConfig: Record<Complaint['severity'], { label: string; className: string }> = {
  low: { label: '低', className: 'bg-green-500/20 text-green-400' },
  medium: { label: '中', className: 'bg-yellow-500/20 text-yellow-400' },
  high: { label: '高', className: 'bg-orange-500/20 text-orange-400' },
  critical: { label: '紧急', className: 'bg-red-500/20 text-red-400 animate-pulse' },
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}

interface CallbackBadgeProps {
  result: Complaint['callback_result'];
}

const callbackConfig: Record<NonNullable<Complaint['callback_result']>, { label: string; className: string }> = {
  satisfied: { label: '满意', className: 'bg-green-500/20 text-green-400' },
  unsatisfied: { label: '不满意', className: 'bg-red-500/20 text-red-400' },
  pending: { label: '待回访', className: 'bg-gray-500/20 text-gray-400' },
};

export function CallbackBadge({ result }: CallbackBadgeProps) {
  if (!result) return <span className="text-white/40">-</span>;
  const config = callbackConfig[result];
  return (
    <span className={`status-badge cursor-pointer hover:opacity-80 transition-opacity ${config.className}`}>
      {config.label}
    </span>
  );
}

interface SyncStatusBadgeProps {
  status: 'pending' | 'running' | 'success' | 'failed';
}

const syncStatusConfig: Record<SyncStatusBadgeProps['status'], { label: string; className: string }> = {
  pending: { label: '等待中', className: 'bg-gray-500/20 text-gray-400' },
  running: { label: '运行中', className: 'bg-blue-500/20 text-blue-400 animate-pulse' },
  success: { label: '成功', className: 'bg-green-500/20 text-green-400' },
  failed: { label: '失败', className: 'bg-red-500/20 text-red-400' },
};

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const config = syncStatusConfig[status];
  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
