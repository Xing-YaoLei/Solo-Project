import type { RiskLevel, AuditStatus, SourceType } from '@/lib/utils';
import { RISK_LABEL, STATUS_LABEL, SOURCE_LABEL, cn } from '@/lib/utils';

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, string> = {
    HIGH: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
    MEDIUM: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    LOW: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  };
  return (
    <span className={cn('chip', map[level])}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          level === 'HIGH' ? 'bg-red-500' : level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500',
        )}
      />
      {RISK_LABEL[level]}
    </span>
  );
}

export function StatusBadge({ status }: { status: AuditStatus }) {
  const map: Record<AuditStatus, string> = {
    CREATED: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
    ASSIGNED: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/20',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
    PENDING_REVIEW: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
    REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
    CLOSED: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  };
  return <span className={cn('chip', map[status])}>{STATUS_LABEL[status]}</span>;
}

export function SourceBadge({ type }: { type: SourceType }) {
  const map: Record<SourceType, string> = {
    PERMISSION_LOG: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
    ERP_EXPORT: 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20',
    EMAIL_MATERIAL: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-600/20',
    COMBINED: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
  };
  return <span className={cn('chip', map[type])}>{SOURCE_LABEL[type]}</span>;
}

export function BatchStatusBadge({
  status,
}: {
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
}) {
  const map = {
    PENDING: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
    PROCESSING: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    SUCCESS: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    FAILED: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  } as const;
  const label = {
    PENDING: '待处理',
    PROCESSING: '处理中',
    SUCCESS: '已完成',
    FAILED: '失败',
  } as const;
  return <span className={cn('chip', map[status])}>{label[status]}</span>;
}
