'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import { cn } from '@/utils/cn';

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number' | 'percent';
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  delay?: number;
}

export default function MetricCard({
  title,
  value,
  format = 'number',
  icon: Icon,
  trend,
  trendLabel,
  delay = 0,
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current = Math.min(increment * step, value);
        setDisplayValue(current);
        if (step >= steps) clearInterval(interval);
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return formatPercent(val);
      default:
        return formatNumber(val);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className="metric-card"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
          {trend !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                trend >= 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{formatPercent(Math.abs(trend))}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-dark-500 mb-1">{title}</p>
        <p className="font-display text-3xl font-bold text-dark-800 animate-number">
          {formatValue(displayValue)}
        </p>
        {trendLabel && (
          <p className="text-xs text-dark-500 mt-2">{trendLabel}</p>
        )}
      </div>
    </motion.div>
  );
}
