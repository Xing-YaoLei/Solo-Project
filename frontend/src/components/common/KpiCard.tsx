import { createElement, ReactElement, ReactNode, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: number | string;
  compareValue?: number;
  trend?: number[];
  icon?: ReactNode | LucideIcon;
  prefix?: string;
  suffix?: string;
  className?: string;
  valueClassName?: string;
}

function Sparkline({ data, color = '#00D4FF' }: { data: number[]; color?: string }) {
  const width = 100;
  const height = 36;
  const padding = 2;

  const points = useMemo(() => {
    if (!data.length) return { area: '', line: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pts = data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return [x, y] as const;
    });

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area =
      `M${pts[0][0].toFixed(1)},${height - padding} ` +
      pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') +
      ` L${pts[pts.length - 1][0].toFixed(1)},${height - padding} Z`;

    return { area, line };
  }, [data, width, height, padding]);

  const gradId = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={points.area} fill={`url(#${gradId})`} />
      <path
        d={points.line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
      />
    </svg>
  );
}

export default function KpiCard({
  label,
  value,
  compareValue,
  trend,
  icon,
  prefix,
  suffix,
  className,
  valueClassName,
}: KpiCardProps) {
  const { changePercent, changeDir, changeColor } = useMemo(() => {
    if (compareValue === undefined || typeof value !== 'number') {
      return { changePercent: 0, changeDir: 'flat' as const, changeColor: 'text-cyan-glow' };
    }
    if (compareValue === 0) {
      return { changePercent: 0, changeDir: 'flat' as const, changeColor: 'text-cyan-glow' };
    }
    const pct = ((value - compareValue) / Math.abs(compareValue)) * 100;
    if (pct > 0) {
      return { changePercent: pct, changeDir: 'up' as const, changeColor: 'text-green-success' };
    } else if (pct < 0) {
      return { changePercent: pct, changeDir: 'down' as const, changeColor: 'text-red-danger' };
    }
    return { changePercent: 0, changeDir: 'flat' as const, changeColor: 'text-cyan-glow' };
  }, [value, compareValue]);

  const displayValue = useMemo(() => {
    if (typeof value === 'string') return value;
    if (value >= 100000000) return (value / 100000000).toFixed(2) + '亿';
    if (value >= 10000) return (value / 10000).toFixed(2) + '万';
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [value]);

  const iconColor = trend && trend.length >= 2 ? (trend[trend.length - 1] >= trend[0] ? '#00D4FF' : '#FF3D57') : '#00D4FF';

  const hasIcon = !!icon;
  const renderIcon = () => {
    if (!hasIcon) return null;
    try {
      return createElement(icon as any, {
        size: 16,
        style: { color: iconColor },
        strokeWidth: 2,
      });
    } catch {
      return <>{icon as ReactNode}</>;
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl p-4 overflow-hidden bg-panel-bg backdrop-blur-sm',
        'border border-panel-border shadow-card hover:shadow-glow-cyan transition-all duration-300',
        'group',
        className,
      )}
      style={{
        background:
          'linear-gradient(135deg, rgba(11,30,63,0.95) 0%, rgba(21,43,85,0.75) 100%)',
      }}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: '1px',
          background: `linear-gradient(135deg, ${iconColor}60 0%, rgba(0,212,255,0.08) 50%, rgba(139,92,246,0.25) 100%)`,
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="relative flex items-start justify-between mb-3">
        <span className="stat-label text-[11px] tracking-[0.12em]">{label}</span>
        {hasIcon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${iconColor}25 0%, ${iconColor}08 100%)`,
              border: `1px solid ${iconColor}40`,
              boxShadow: `0 0 12px ${iconColor}30`,
            }}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              'font-display font-bold text-2xl sm:text-3xl text-white leading-none glow-text tracking-tight',
              valueClassName,
            )}
            style={{ textShadow: `0 0 14px ${iconColor}55` }}
          >
            {prefix && <span className="text-white/60 text-lg mr-0.5 font-semibold">{prefix}</span>}
            {displayValue}
            {suffix && <span className="text-white/60 text-sm ml-0.5 font-medium">{suffix}</span>}
          </div>

          {compareValue !== undefined && (
            <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', changeColor)}>
              {changeDir === 'up' && <TrendingUp size={13} strokeWidth={2.5} />}
              {changeDir === 'down' && <TrendingDown size={13} strokeWidth={2.5} />}
              {changeDir === 'flat' && <Minus size={13} strokeWidth={2.5} />}
              <span className="tabular-nums">
                {changeDir === 'up' ? '+' : ''}
                {changePercent.toFixed(1)}%
              </span>
              <span className="text-white/40 ml-1">环比</span>
            </div>
          )}
        </div>

        {trend && trend.length >= 7 && (
          <div className="w-[100px] shrink-0 mb-0.5">
            <Sparkline data={trend.slice(0, 14)} color={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}
