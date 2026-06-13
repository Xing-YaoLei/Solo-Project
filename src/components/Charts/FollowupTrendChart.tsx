'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FollowupTrend } from '@/types';
import { formatPercent } from '@/utils/format';

const COLORS = {
  'V1-关心回访': '#B76E79',
  'V2-效果询问': '#C9A961',
  'V3-满意度调查': '#7E6D87',
};

interface FollowupTrendChartProps {
  data: FollowupTrend[];
}

export default function FollowupTrendChart({ data }: FollowupTrendChartProps) {
  const scripts = Array.from(new Set(data.map(d => d.script)));

  const transformedData = data.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing[item.script] = item.responseRate;
      existing[`${item.script}_count`] = item.count;
    } else {
      acc.push({
        date: item.date,
        [item.script]: item.responseRate,
        [`${item.script}_count`]: item.count,
      });
    }
    return acc;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="card p-6"
    >
      <h3 className="font-display text-xl font-semibold text-dark-800 mb-6">回访话术变化趋势</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformedData} margin={{ left: 20, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EBD5C4" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: '#5A4764' }} />
            <YAxis
              fontSize={12}
              tick={{ fill: '#5A4764' }}
              tickFormatter={value => formatPercent(value, 0)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-cream-200">
                      <p className="font-medium text-dark-800 mb-2">{payload[0].payload.date}</p>
                      {payload.map((entry: any) => (
                        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-dark-600">{entry.dataKey}:</span>
                          <span className="font-medium" style={{ color: entry.color }}>
                            {formatPercent(entry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {scripts.map(script => (
              <Line
                key={script}
                type="monotone"
                dataKey={script}
                stroke={COLORS[script as keyof typeof COLORS] || '#B76E79'}
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                isAnimationActive
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {scripts.map(script => {
          const avgRate = data.filter(d => d.script === script).reduce((sum, d) => sum + d.responseRate, 0) /
            data.filter(d => d.script === script).length;
          const totalCount = data.filter(d => d.script === script).reduce((sum, d) => sum + d.count, 0);
          return (
            <div key={script} className="text-center p-3 bg-cream-50 rounded-xl">
              <p className="text-xs text-dark-500 mb-1">{script}</p>
              <p
                className="text-xl font-bold"
                style={{ color: COLORS[script as keyof typeof COLORS] }}
              >
                {formatPercent(avgRate)}
              </p>
              <p className="text-xs text-dark-500">平均响应率 · {totalCount}次</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
