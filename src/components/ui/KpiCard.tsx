import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  trend,
  trendLabel = '环比',
  accent = 'brand',
  sub,
  progress,
  footer,
}: {
  label: string;
  value: ReactNode;
  trend?: number;
  trendLabel?: string;
  accent?: 'brand' | 'danger' | 'warning' | 'success';
  sub?: ReactNode;
  progress?: number;
  footer?: ReactNode;
}) {
  const accentMap = {
    brand: 'from-brand-500 to-brand-800',
    danger: 'from-red-500 to-red-700',
    warning: 'from-amber-500 to-amber-700',
    success: 'from-emerald-500 to-emerald-700',
  } as const;
  const barMap = {
    brand: 'bg-brand-600',
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
  } as const;

  return (
    <div className="card card-hover p-5 overflow-hidden relative animate-slide-up">
      <div
        className={cn(
          'absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl pointer-events-none',
          accentMap[accent],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 tracking-wide">{label}</div>
          <div className="kpi-number text-slate-900 mt-1.5">{value}</div>
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'chip shrink-0',
              trend >= 0
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
            )}
          >
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
            <span className="text-slate-400 ml-0.5">{trendLabel}</span>
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', barMap[accent])}
              style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
            />
          </div>
          {sub && <div className="mt-1.5 text-xs text-slate-500">{sub}</div>}
        </div>
      )}
      {footer && <div className="mt-4 pt-3 border-t border-slate-100">{footer}</div>}
    </div>
  );
}
