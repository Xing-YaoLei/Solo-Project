import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Variant = 'primary' | 'trend' | 'ring';

interface BaseProps {
  variant?: Variant;
  className?: string;
}

interface PrimaryProps extends BaseProps {
  variant: 'primary';
  title: string;
  value: string | number;
  delta?: { value: number; label: string };
  subTitle?: string;
}

interface TrendProps extends BaseProps {
  variant: 'trend';
  title: string;
  value: string | number;
  delta?: { value: number; label: string };
  data: number[];
  color?: string;
}

interface RingProps extends BaseProps {
  variant: 'ring';
  title: string;
  segments: { label: string; value: number; color: string }[];
  total?: string;
  note?: string;
}

export type MetricCardProps = PrimaryProps | TrendProps | RingProps;

export function MetricCard(props: MetricCardProps) {
  const variant = props.variant ?? 'primary';
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-surface-card backdrop-blur-xl border border-surface-border shadow-card',
        'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-blue/40',
        'p-5 animate-slide-up',
        props.className
      )}
    >
      <div className="absolute inset-0 bg-glow-top pointer-events-none" />
      <div className="relative">
        {variant === 'primary' && <PrimaryInner {...(props as PrimaryProps)} />}
        {variant === 'trend' && <TrendInner {...(props as TrendProps)} />}
        {variant === 'ring' && <RingInner {...(props as RingProps)} />}
      </div>
    </div>
  );
}

function DeltaBadge({ delta }: { delta?: { value: number; label: string } }) {
  if (!delta) return null;
  const positive = delta.value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
        positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
      )}
    >
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(delta.value)}
      {delta.label}
    </span>
  );
}

function PrimaryInner({ title, value, delta, subTitle }: Omit<PrimaryProps, 'variant'>) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wider text-slate-400 uppercase">{title}</span>
        <DeltaBadge delta={delta} />
      </div>
      <div className="mt-3 font-display text-4xl font-bold text-white tracking-tight">{value}</div>
      {subTitle && <div className="mt-1 text-sm text-slate-400">{subTitle}</div>}
    </>
  );
}

function TrendInner({ title, value, delta, data, color = '#3B82F6' }: Omit<TrendProps, 'variant'>) {
  const { path, areaPath, min, max } = useMemo(() => buildMiniLine(data, 140, 44), [data]);
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-wider text-slate-400 uppercase">{title}</span>
        <DeltaBadge delta={delta} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="font-display text-2xl font-bold text-white">{value}</div>
        <svg viewBox={`0 0 140 44`} className="w-[140px] h-11 shrink-0">
          <defs>
            <linearGradient id={`g-${title}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#g-${title})`} />
          <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}

function RingInner({ title, segments, total, note }: Omit<RingProps, 'variant'>) {
  const size = 110;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const sum = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  let offset = 0;
  return (
    <div className="flex items-start gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
          {segments.map((seg, i) => {
            const len = (seg.value / sum) * C;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {total && <div className="font-display text-2xl font-bold text-white">{total}</div>}
          <div className="text-[10px] text-slate-400 mt-0.5">占比Top3</div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs tracking-wider text-slate-400 uppercase mb-2">{title}</div>
        <ul className="space-y-1.5">
          {segments.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 truncate">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="text-slate-400 tabular-nums">{s.value}%</span>
            </li>
          ))}
        </ul>
        {note && <div className="mt-2 text-[11px] text-slate-500">{note}</div>}
      </div>
    </div>
  );
}

function buildMiniLine(data: number[], w: number, h: number) {
  if (data.length === 0) return { path: '', areaPath: '', min: 0, max: 0 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [i * stepX, h - ((v - min) / range) * (h - 4) - 2] as const);
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const areaPath = `${path} L ${w} ${h} L 0 ${h} Z`;
  return { path, areaPath, min, max };
}
