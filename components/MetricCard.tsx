'use client';

import React from 'react';
import { cn, formatPercent, formatNumber } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  format?: 'number' | 'percent' | 'currency';
  gradient?: string;
  icon?: React.ReactNode;
  isAnomaly?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  format = 'number',
  gradient = 'from-blue-500 to-cyan-500',
  icon,
  isAnomaly,
  className,
}: MetricCardProps) {
  const formatValue = (v: number | string): string => {
    if (typeof v === 'string') return v;
    switch (format) {
      case 'percent':
        return formatPercent(v);
      case 'currency':
        return `¥${formatNumber(Math.round(v))}`;
      default:
        return formatNumber(v);
    }
  };

  const getTrendColor = (t?: number) => {
    if (!t) return 'text-slate-400';
    if (t > 0) return 'text-risk-low';
    if (t < 0) return 'text-risk-high';
    return 'text-slate-400';
  };

  const getTrendIcon = (t?: number) => {
    if (!t) return <Minus className="w-4 h-4" />;
    if (t > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div
      className={cn(
        "glass-card p-6 relative overflow-hidden",
        isAnomaly && "anomaly-pulse border-risk-high/50",
        className
      )}
    >
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl -mr-16 -mt-16",
        `bg-gradient-to-br ${gradient}`
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
          {icon && (
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
              gradient
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="count-animate">
          <p className={cn(
            "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
            gradient
          )}>
            {formatValue(value)}
          </p>
        </div>

        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}

        {trend !== undefined && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <div className={cn("flex items-center gap-1", getTrendColor(trend))}>
              {getTrendIcon(trend)}
              <span className="text-sm font-medium">
                {trend > 0 ? '+' : ''}{formatPercent(trend)}
              </span>
            </div>
            {trendLabel && (
              <span className="text-sm text-slate-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
