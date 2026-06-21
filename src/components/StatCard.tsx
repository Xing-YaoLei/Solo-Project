'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatNumber, formatPercent } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  trend?: number;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  isPercentage?: boolean;
  isCurrency?: boolean;
  delay?: number;
}

export function StatCard({
  title,
  value,
  prefix,
  suffix,
  trend,
  icon,
  gradientFrom,
  gradientTo,
  isPercentage,
  isCurrency,
  delay = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const stepValue = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += stepValue;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(interval);
    }
  }, [isVisible, value]);

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (isPercentage) return formatPercent(val);
    if (isCurrency) return `¥${formatNumber(val)}`;
    return formatNumber(val);
  };

  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? 'text-success' : trend && trend < 0 ? 'text-danger' : 'text-neutral-400';

  return (
    <div
      className={cn(
        'card card-hover gradient-card p-5 opacity-0 transition-opacity duration-500',
        isVisible && 'opacity-100'
      )}
      style={{
        // @ts-ignore
        '--tw-gradient-from': gradientFrom,
        '--tw-gradient-to': gradientTo,
      }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-400">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              {prefix && <span className="text-lg text-neutral-400">{prefix}</span>}
              <span className="font-display text-3xl font-bold text-white number-scroll">
                {typeof value === 'number' ? formatValue(displayValue) : formatValue(value)}
              </span>
              {suffix && <span className="text-lg text-neutral-400">{suffix}</span>}
            </div>
            {trend !== undefined && (
              <div className={`mt-2 flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                <span className="font-medium">
                  {trend > 0 ? '+' : ''}{formatPercent(trend, 1)}
                </span>
                <span className="text-neutral-500">较上周</span>
              </div>
            )}
          </div>
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}40, ${gradientTo}40)`,
            }}
          >
            {icon}
          </div>
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: isVisible && typeof value === 'number' ? '100%' : '0%',
              background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
