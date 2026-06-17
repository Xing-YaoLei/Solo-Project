import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  color: 'blue' | 'green' | 'orange' | 'red';
  delay?: number;
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-700',
  green: 'from-emerald-500 to-emerald-700',
  orange: 'from-orange-500 to-orange-700',
  red: 'from-red-500 to-red-700',
};

const iconBgClasses = {
  blue: 'bg-blue-400/20 text-blue-100',
  green: 'bg-emerald-400/20 text-emerald-100',
  orange: 'bg-orange-400/20 text-orange-100',
  red: 'bg-red-400/20 text-red-100',
};

export function StatCard({ title, value, unit, icon: Icon, trend, color, delay = 0 }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(value);

  useEffect(() => {
    if (typeof value === 'number') {
      const timer = setTimeout(() => {
        const duration = 1000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        const interval = setInterval(() => {
          current += increment;
          if (current >= value) {
            setDisplayValue(value);
            clearInterval(interval);
          } else {
            setDisplayValue(Math.floor(current * 10) / 10);
          }
        }, duration / steps);
        return () => clearInterval(interval);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [value, delay]);

  const display = typeof value === 'number'
    ? (Number.isInteger(value) ? displayValue.toFixed(0) : displayValue.toFixed(1))
    : value;

  return (
    <div
      className={cn(
        'card overflow-hidden opacity-0 animate-fade-in-up',
        `animate-stagger-${Math.floor(delay / 50) + 1}`
      )}
      style={{ animationFillMode: 'forwards' }}
    >
      <div className={cn('p-6 bg-gradient-to-br text-white', colorClasses[color])}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold font-display tracking-tight">
                {display}
              </span>
              {unit && <span className="text-sm text-white/70">{unit}</span>}
            </div>
            {trend !== undefined && (
              <div className={cn(
                'mt-2 inline-flex items-center gap-1 text-sm px-2 py-0.5 rounded',
                trend < 0 ? 'bg-white/20' : 'bg-white/10'
              )}>
                {trend < 0 ? '↓' : '↑'} {Math.abs(trend)}%
                <span className="text-white/70 ml-1">较上期</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconBgClasses[color])}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
