import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: '待审核', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  in_review: { label: '审核中', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  approved: { label: '已通过', bg: 'bg-mint-50', text: 'text-mint-600', dot: 'bg-mint-400' },
  rejected: { label: '已驳回', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  exception: { label: '异常', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  open: { label: '待处理', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  processing: { label: '处理中', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  resolved: { label: '已解决', bg: 'bg-mint-50', text: 'text-mint-600', dot: 'bg-mint-400' },
  closed: { label: '已关闭', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
  matched: { label: '已匹配', bg: 'bg-mint-50', text: 'text-mint-600', dot: 'bg-mint-400' },
  unmatched: { label: '未匹配', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
  partial: { label: '部分匹配', bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
  shipped: { label: '已发货', bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
  delivered: { label: '已到货', bg: 'bg-mint-50', text: 'text-mint-600', dot: 'bg-mint-400' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface CardProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, children, className = '', actions }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-slate-300 mb-3">{icon}</div>}
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {description && <p className="text-2xs text-slate-400 mt-1">{description}</p>}
    </div>
  );
}
