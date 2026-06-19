import { useState, useEffect, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  delay?: number;
}

function useCountUp(endValue: number, duration: number = 1500, delay: number = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (typeof endValue !== 'number') {
      setValue(endValue);
      return;
    }

    const startTimer = setTimeout(() => {
      const startTime = performance.now();
      const startValue = 0;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        setValue(Math.round(startValue + (endValue - startValue) * easeProgress));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [endValue, duration, delay]);

  return value;
}

const colorClasses = {
  primary: 'from-primary-500/20 to-primary-500/5 border-primary-500/30 text-primary-400',
  success: 'from-success-500/20 to-success-500/5 border-success-500/30 text-success-400',
  warning: 'from-warning-500/20 to-warning-500/5 border-warning-500/30 text-warning-400',
  danger: 'from-danger-500/20 to-danger-500/5 border-danger-500/30 text-danger-400',
  info: 'from-info-500/20 to-info-500/5 border-info-500/30 text-info-400',
};

const changeColorClasses = {
  primary: 'text-primary-400 bg-primary-500/10',
  success: 'text-success-400 bg-success-500/10',
  warning: 'text-warning-400 bg-warning-500/10',
  danger: 'text-danger-400 bg-danger-500/10',
  info: 'text-info-400 bg-info-500/10',
};

export function KPICard({
  icon,
  label,
  value,
  change = 0,
  changeLabel = '同比',
  color = 'primary',
  loading = false,
  delay = 0,
}: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const displayValue = typeof value === 'string' ? value : useCountUp(numericValue, 1500, delay);

  const isPositive = change > 0;
  const isZero = change === 0;
  const isInverse = color === 'danger' || color === 'warning';
  const showPositive = isInverse ? !isPositive : isPositive;

  const ChangeIcon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`glass-card rounded-xl p-5 border bg-gradient-to-br ${colorClasses[color]} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-white/5">
          {icon}
        </div>
        {change !== undefined && !loading && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isZero ? 'bg-gray-500/10 text-gray-400' :
            showPositive ? changeColorClasses.success : changeColorClasses.danger
          }`}>
            <ChangeIcon className="w-3 h-3" />
            <span>{change >= 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-400 font-medium">
          {label}
          {changeLabel && <span className="text-gray-500 ml-1">({changeLabel})</span>}
        </p>
        {loading ? (
          <div className="h-9 w-24 bg-white/5 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white font-display">
            {displayValue}
          </p>
        )}
      </div>
    </div>
  );
}

export default KPICard;
