'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/types';
import { formatNumber, formatPercent } from '@/lib/utils';
import { getChartColor } from '@/lib/mockData';

interface DataItem {
  name: string;
  value: number;
  label: string;
}

interface CompositionPieChartProps {
  data: DataItem[];
  title: string;
  totalLabel?: string;
  className?: string;
}

export function CompositionPieChart({
  data,
  title,
  totalLabel = '总计',
  className,
}: CompositionPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = (item.value / total) * 100;
      return (
        <div className="rounded-lg border border-neutral-700 bg-background-light p-3 shadow-xl">
          <p className="font-medium text-white">{item.payload.label}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-white">
              {formatNumber(item.value)}
            </span>
            <span className="text-sm text-neutral-400">
              ({formatPercent(percentage / 100)})
            </span>
          </div>
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
    index,
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

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {payload.map((entry: any, index: number) => (
          <li
            key={index}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer transition-colors',
              activeIndex === index ? 'bg-neutral-700/50' : 'hover:bg-neutral-800'
            )}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 text-sm text-neutral-300">{entry.value}</span>
            <span className="font-mono text-sm text-white">
              {formatNumber(data[index].value)}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={cn('card p-5', className)}>
      <h3 className="mb-4 font-display font-semibold text-white">{title}</h3>
      
      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              labelLine={false}
              label={renderCustomizedLabel}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getChartColor(index)}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                  stroke={activeIndex === index ? '#fff' : 'transparent'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  style={{
                    transition: 'all 0.3s ease',
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-neutral-400">{totalLabel}</p>
            <p className="font-display text-2xl font-bold text-white">
              {formatNumber(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
