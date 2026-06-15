'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: number;
  unit?: string;
  suffix?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  delay?: number;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-emerald-500 to-emerald-600',
  amber: 'from-amber-500 to-amber-600',
  red: 'from-red-500 to-red-600',
  purple: 'from-purple-500 to-purple-600',
};

export default function KPICard({
  title,
  value,
  unit,
  suffix,
  trend,
  trendLabel,
  icon,
  color,
  delay = 0,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  const formatValue = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'k';
    }
    return val.toFixed(value % 1 === 0 ? 0 : 1);
  };

  const trendIcon = trend && trend > 0 ? (
    <ArrowUp className="w-4 h-4" />
  ) : trend && trend < 0 ? (
    <ArrowDown className="w-4 h-4" />
  ) : (
    <Minus className="w-4 h-4" />
  );

  const trendColor = trend && trend > 0
    ? 'text-emerald-600'
    : trend && trend < 0
    ? 'text-red-600'
    : 'text-gray-500';

  return (
    <div
      className={clsx(
        'card-gradient p-6 opacity-0 animate-fade-in',
        isVisible && 'opacity-100'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <div className="flex items-baseline gap-1">
            {unit && <span className="text-lg text-gray-500 font-mono">{unit}</span>}
            <span className="text-3xl font-bold font-mono text-gray-900 count-up">
              {formatValue(displayValue)}
            </span>
            {suffix && <span className="text-lg text-gray-500">{suffix}</span>}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-3">
              <span className={clsx('flex items-center gap-0.5 text-sm font-medium', trendColor)}>
                {trendIcon}
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-gray-400 ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={clsx(
            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg',
            colorClasses[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
