import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  status?: 'normal' | 'warning' | 'danger' | 'success';
  className?: string;
}

const statusColors = {
  normal: 'bg-slate-50 text-slate-600',
  warning: 'bg-yellow-50 text-yellow-600',
  danger: 'bg-red-50 text-red-600',
  success: 'bg-green-50 text-green-600',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status = 'normal',
  className,
}: StatCardProps) {
  return (
    <div className={cn('card p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl', statusColors[status])}>
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              'text-sm font-medium',
              trend.isUp ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-400">较上周期</span>
        </div>
      )}
    </div>
  );
}
