'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import type { CheckinRecord } from '@/types';
import { formatNumber, formatPercent, formatDate } from '@/lib/utils';

interface CheckinTrendChartProps {
  data: CheckinRecord[];
  height?: number;
}

export function CheckinTrendChart({ data, height = 350 }: CheckinTrendChartProps) {
  const chartData = data.map(item => ({
    date: formatDate(item.date),
    入住数量: item.totalCount,
    异常数量: item.anomalyCount,
    异常率: Number((item.anomalyRate * 100).toFixed(1)),
    hotelName: item.hotelName,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {entry.name === '异常率' ? `${entry.value}%` : formatNumber(entry.value)}
            </p>
          ))}
          {payload[0]?.payload?.hotelName && (
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-700">
              门店: {payload[0].payload.hotelName}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: '数量',
              angle: -90,
              position: 'insideLeft',
              fill: '#94a3b8',
              fontSize: 12,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: '异常率 (%)',
              angle: 90,
              position: 'insideRight',
              fill: '#94a3b8',
              fontSize: 12,
            }}
            domain={[0, 30]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            formatter={(value: string) => (
              <span className="text-sm text-slate-300">{value}</span>
            )}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="入住数量"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorTotal)"
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
          <Bar
            yAxisId="left"
            dataKey="异常数量"
            fill="#e53e3e"
            radius={[4, 4, 0, 0]}
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="异常率"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 4, fill: '#f59e0b' }}
            activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
