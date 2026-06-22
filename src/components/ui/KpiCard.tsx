import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Accent = 'brand' | 'danger' | 'warning' | 'success' | 'rose' | 'emerald' | 'amber';

interface KpiCardProps {
  label?: string;
  title?: string;
  value: ReactNode;
  hint?: string;
  sub?: ReactNode;
  trend?: number | { delta: number; upGood: boolean };
  trendLabel?: string;
  accent?: Accent;
  progress?: number | { value: number; max: number };
  icon?: React.ComponentType<{ className?: string }>;
  footer?: ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  title,
  value,
  hint,
  sub,
  trend,
  trendLabel = '环比',
  accent = 'brand',
  progress,
  icon: Icon,
  footer,
  className,
}: KpiCardProps) {
  const displayLabel = title ?? label ?? '';

  const accentToTone: Record<Accent, 'brand' | 'danger' | 'warning' | 'success'> = {
    brand: 'brand',
    danger: 'danger',
    rose: 'danger',
    warning: 'warning',
    amber: 'warning',
    success: 'success',
    emerald: 'success',
  };
  const tone = accentToTone[accent];

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

  let trendNum: number | undefined;
  let trendUpGood = true;
  if (typeof trend === 'number') {
    trendNum = trend;
  } else if (trend) {
    trendNum = trend.delta;
    trendUpGood = trend.upGood;
  }

  let progressPct: number | undefined;
  if (typeof progress === 'number') {
    progressPct = progress;
  } else if (progress) {
    progressPct = progress.max > 0 ? progress.value / progress.max : 0;
  }

  return (
    <div className={cn('card card-hover p-5 overflow-hidden relative animate-slide-up', className)}>
      <div
        className={cn(
          'absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl pointer-events-none',
          accentMap[tone],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  {
                    brand: 'bg-brand-50 text-brand-700',
                    danger: 'bg-red-50 text-red-700',
                    warning: 'bg-amber-50 text-amber-700',
                    success: 'bg-emerald-50 text-emerald-700',
                  }[tone],
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="text-xs font-medium text-slate-500 tracking-wide">{displayLabel}</div>
          </div>
          <div className="kpi-number text-slate-900 mt-2">{value}</div>
          {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
        </div>
        {trendNum !== undefined && (
          <div
            className={cn(
              'chip shrink-0',
              (trendNum >= 0 ? trendUpGood : !trendUpGood)
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
            )}
          >
            {trendNum >= 0 ? '▲' : '▼'} {Math.abs(trendNum).toFixed(1)}%
            <span className="text-slate-400 ml-0.5">{trendLabel}</span>
          </div>
        )}
      </div>
      {progressPct !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', barMap[tone])}
              style={{ width: `${Math.max(0, Math.min(100, progressPct * 100))}%` }}
            />
          </div>
          {sub && <div className="mt-1.5 text-xs text-slate-500">{sub}</div>}
        </div>
      )}
      {footer && <div className="mt-4 pt-3 border-t border-slate-100">{footer}</div>}
    </div>
  );
}
