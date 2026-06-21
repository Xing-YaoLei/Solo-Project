'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { CHART_COLORS } from '@/types';
import { formatNumber, formatCurrency, formatDateShort } from '@/lib/utils';

interface DailyDataPoint {
  date: string;
  count: number;
  amount: number;
}

interface DailySalesBarChartProps {
  data: DailyDataPoint[];
  className?: string;
}

export function DailySalesBarChart({ data, className }: DailySalesBarChartProps) {
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
              <span className="font-mono font-medium text-white">
                {entry.name === '订单数' ? formatNumber(entry.value) : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('card p-5', className)}>
      <h3 className="mb-4 font-display font-semibold text-white">每日销量趋势</h3>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => formatDateShort(value)}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="订单数"
              fill="url(#barGradient)"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="amount"
              name="销售金额"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={{ r: 3, fill: CHART_COLORS.accent }}
              activeDot={{ r: 5 }}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary" />
          <span className="text-sm text-neutral-400">订单数</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-6 bg-accent" />
          <span className="text-sm text-neutral-400">销售金额</span>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
