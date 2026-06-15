import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel = '较昨日',
  icon: Icon,
  gradient,
  iconBg,
  suffix,
}) => {
  const isPositive = (change || 0) >= 0;

  return (
    <div className="stat-card card-gradient" style={{ background: gradient }}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-dark-300 text-sm font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-white font-mono tracking-tight">
              {value}
              {suffix && <span className="text-lg ml-1 text-dark-300">{suffix}</span>}
            </p>
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon size={24} className="text-white" />
          </div>
        </div>

        {typeof change !== 'undefined' && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                isPositive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              {isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-xs text-dark-400">{changeLabel}</span>
          </div>
        )}
      </div>
      <div
        className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 blur-2xl"
        style={{ background: iconBg }}
      />
    </div>
  );
};

export default StatCard;
