'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface DepositPieChartProps {
  breakdown: {
    total: number;
    refunded: number;
    deducted: number;
    pending: number;
  };
  height?: number;
}

const COLORS = {
  refunded: '#38a169',
  deducted: '#e53e3e',
  pending: '#dd6b20',
  other: '#64748b',
};

export function DepositPieChart({ breakdown, height = 350 }: DepositPieChartProps) {
  const data = [
    { name: '已退还', value: breakdown.refunded, color: COLORS.refunded },
    { name: '已扣除', value: breakdown.deducted, color: COLORS.deducted },
    { name: '待处理', value: breakdown.pending, color: COLORS.pending },
    {
      name: '其他',
      value: breakdown.total - breakdown.refunded - breakdown.deducted - breakdown.pending,
      color: COLORS.other,
    },
  ].filter(item => item.value > 0);

  const total = breakdown.total;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white mb-2" style={{ color: item.color }}>
            {item.name}
          </p>
          <p className="text-sm text-slate-300">
            金额: <span className="font-medium">{formatCurrency(item.value)}</span>
          </p>
          <p className="text-sm text-slate-400">
            占比: <span className="font-medium">{percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="relative" style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1000}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string, entry: any) => (
                <span className="text-sm text-slate-300">
                  {value} ({formatCurrency(entry.payload.value)})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-slate-400">押金总额</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
