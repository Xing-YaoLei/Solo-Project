'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from 'recharts';
import { CHART_COLORS } from '@/types';
import type { SeatTrendDataPoint } from '@/types';
import { formatNumber, formatDateShort } from '@/lib/utils';

interface SeatTrendChartProps {
  data: SeatTrendDataPoint[];
  className?: string;
}

export function SeatTrendChart({ data, className }: SeatTrendChartProps) {
  const [activeKeys, setActiveKeys] = useState<string[]>(['sold', 'locked', 'available']);

  const toggleKey = (key: string) => {
    setActiveKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-neutral-700 bg-background-light p-3 shadow-xl">
          <p className="mb-2 font-medium text-white">{formatDateShort(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neutral-300">{entry.name}</span>
              <span className="font-mono font-medium text-white">{formatNumber(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const series = [
    { key: 'sold', name: '已售', color: CHART_COLORS.primary, stackId: 'status' },
    { key: 'locked', name: '锁座', color: CHART_COLORS.accent, stackId: 'status' },
    { key: 'available', name: '可售', color: CHART_COLORS.neutral, stackId: 'status' },
  ];

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-2">
        {series.map((s) => (
          <button
            key={s.key}
            onClick={() => toggleKey(s.key)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
              activeKeys.includes(s.key)
                ? 'border-transparent bg-neutral-700 text-white'
                : 'border-neutral-700 bg-transparent text-neutral-500'
            }`}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: activeKeys.includes(s.key) ? s.color : '#475569',
              }}
            />
            {s.name}
          </button>
        ))}
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => formatDateShort(value)}
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-neutral-400">{value}</span>}
            />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                fill={`url(#gradient-${s.key})`}
                strokeWidth={2}
                hide={!activeKeys.includes(s.key)}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
            <Brush
              dataKey="date"
              height={30}
              stroke={CHART_COLORS.primary}
              fill="#1E293B"
              tickFormatter={(value) => formatDateShort(value)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
