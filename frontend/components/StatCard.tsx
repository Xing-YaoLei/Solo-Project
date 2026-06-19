import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-2 flex items-center text-xs',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span className="ml-1">{Math.abs(trend.value)}%</span>
              <span className="ml-1 text-slate-500">较上月</span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600',
            iconClassName
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
