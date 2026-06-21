'use client';

import { cn, formatPercentage } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: number;
  suffix?: string;
  isPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

export function KpiCard({
  title,
  value,
  icon,
  trend,
  suffix,
  isPercentage = false,
  color = 'primary',
}: KpiCardProps) {
  const colorClasses = {
    primary: 'from-primary-50 to-primary-100 text-primary-600',
    success: 'from-green-50 to-green-100 text-green-600',
    warning: 'from-amber-50 to-amber-100 text-amber-600',
    danger: 'from-red-50 to-red-100 text-red-600',
  };

  const iconColorClasses = {
    primary: 'bg-primary-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  const displayValue =
    typeof value === 'number' && isPercentage
      ? formatPercentage(value)
      : value.toLocaleString();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-lg',
        colorClasses[color]
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-900">
              {displayValue}
              {suffix && (
                <span className="ml-1 text-lg font-normal text-slate-500">
                  {suffix}
                </span>
              )}
            </p>
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl shadow-md',
              iconColorClasses[color]
            )}
          >
            {icon}
          </div>
        </div>

        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-1.5">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : trend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <Minus className="h-4 w-4 text-slate-500" />
            )}
            <span
              className={cn(
                'text-sm font-medium',
                trend > 0
                  ? 'text-green-600'
                  : trend < 0
                  ? 'text-red-600'
                  : 'text-slate-500'
              )}
            >
              {trend > 0 ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
            <span className="text-sm text-slate-500">较上周</span>
          </div>
        )}
      </div>

      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
    </div>
  );
}
