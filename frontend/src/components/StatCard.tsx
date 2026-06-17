import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeUnit?: string;
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'danger';
}

export default function StatCard({
  title,
  value,
  unit = '',
  change,
  changeUnit = '%',
  icon,
  variant = 'default',
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const showChange = change !== undefined;

  const variantClasses = {
    default: 'bg-white',
    primary: 'bg-gradient-to-br from-primary-50 to-white',
    warning: 'bg-gradient-to-br from-warning-50 to-white',
    danger: 'bg-gradient-to-br from-danger-50 to-white',
  };

  const iconBgClasses = {
    default: 'bg-slate-100 text-slate-600',
    primary: 'bg-primary-100 text-primary-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5',
        variantClasses[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-slate-800">{value}</span>
            {unit && <span className="text-sm text-slate-500">{unit}</span>}
          </div>
          {showChange && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-sm font-medium',
                isPositive ? 'text-emerald-600' : 'text-danger-500'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>
                {isPositive ? '+' : ''}
                {change}
                {changeUnit}
              </span>
              <span className="text-slate-400 text-xs ml-1">较上周</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              iconBgClasses[variant]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
