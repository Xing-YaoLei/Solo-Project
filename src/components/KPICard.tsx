import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPIData } from '@/types';
import { cn } from '@/lib/utils';

interface KPICardProps {
  data: KPIData;
  onClick?: (data: KPIData) => void;
  className?: string;
}

function useCountAnimation(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const start = value;
    const diff = target - start;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, value]);

  return value;
}

function TrendIcon({ trend }: { trend: KPIData['trend'] }) {
  if (trend === 'up')
    return <TrendingUp size={16} className="text-emerald-400" />;
  if (trend === 'down')
    return <TrendingDown size={16} className="text-orange-400" />;
  return <Minus size={16} className="text-slate-400" />;
}

function ChangeBadge({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  return (
    <span
      className={cn(
        'text-xs',
        isNeutral
          ? 'text-slate-400'
          : isPositive
            ? 'text-emerald-400'
            : 'text-orange-400',
      )}
    >
      {label} {isPositive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

export default function KPICard({ data, onClick, className }: KPICardProps) {
  const animatedValue = useCountAnimation(data.value);

  return (
    <button
      onClick={() => onClick?.(data)}
      className={cn(
        'glass-card group flex flex-col gap-3 rounded-lg border border-white/5 p-5 text-left transition-all hover:border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/5',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{data.name}</span>
        <TrendIcon trend={data.trend} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold tracking-tight number-animate">
          {data.unit === '%'
            ? animatedValue.toFixed(1)
            : animatedValue.toLocaleString('zh-CN', {
                maximumFractionDigits: 0,
              })}
        </span>
        {data.unit && (
          <span className="text-sm text-slate-500">{data.unit}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ChangeBadge label="同比" value={data.yoyChange} />
        <span className="text-xs text-slate-600">|</span>
        <ChangeBadge label="环比" value={data.momChange} />
      </div>
    </button>
  );
}
