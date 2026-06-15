'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { TrendingUp, Target, Calendar, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { UtilizationComparison } from '@/types';

interface UtilizationComparisonChartProps {
  data: UtilizationComparison[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip min-w-56">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-mono font-medium" style={{ color: entry.color }}>
                {entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
        {data.improvementMeasure && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-emerald-600 text-sm">
              <Zap className="w-4 h-4" />
              <span className="font-medium">改善措施</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{data.improvementMeasure}</p>
          </div>
        )}
        {data.isImproved !== undefined && (
          <div className={`mt-2 flex items-center gap-1 text-sm ${data.isImproved ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.isImproved ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4 rotate-180" />
            )}
            <span className="font-medium">{data.isImproved ? '利用率提升' : '利用率下降'}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function UtilizationComparisonChart({ data }: UtilizationComparisonChartProps) {
  const latestData = data[data.length - 1];

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm text-gray-500">当前利用率</span>
          </div>
          <div className="text-2xl font-bold font-mono text-primary-700">
            {latestData.current.toFixed(1)}%
          </div>
          <div className={clsx(
            'text-xs mt-1 flex items-center gap-1',
            latestData.monthOnMonth > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {latestData.monthOnMonth > 0 ? '↑' : '↓'} 环比 {Math.abs(latestData.monthOnMonth).toFixed(1)}%
          </div>
        </div>

        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">同比</span>
          </div>
          <div className={clsx(
            'text-2xl font-bold font-mono',
            latestData.yearOnYear > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {latestData.yearOnYear > 0 ? '+' : ''}{latestData.yearOnYear.toFixed(1)}%
          </div>
          <div className="text-xs mt-1 text-gray-500">较去年同期</div>
        </div>

        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">环比</span>
          </div>
          <div className={clsx(
            'text-2xl font-bold font-mono',
            latestData.monthOnMonth > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {latestData.monthOnMonth > 0 ? '+' : ''}{latestData.monthOnMonth.toFixed(1)}%
          </div>
          <div className="text-xs mt-1 text-gray-500">较上学期</div>
        </div>

        <div className="card-gradient p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">目标值</span>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700">
            {latestData.target}%
          </div>
          <div className={clsx(
            'text-xs mt-1',
            latestData.current >= latestData.target ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {latestData.current >= latestData.target ? '✓ 已达成' : `还差 ${(latestData.target - latestData.current).toFixed(1)}%`}
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d5a87" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2d5a87" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={[40, 80]}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
              formatter={(value) => {
                const labels: Record<string, string> = {
                  current: '当前利用率',
                  yearOnYear: '同比',
                  monthOnMonth: '环比',
                };
                return <span className="text-sm text-gray-600">{labels[value] || value}</span>;
              }}
            />

            <ReferenceLine
              y={latestData.target}
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: `目标 ${latestData.target}%`, position: 'right', fill: '#8b5cf6', fontSize: 11 }}
            />

            {data.map((entry, index) => (
              entry.improvementMeasure && (
                <ReferenceLine
                  key={`measure-${index}`}
                  x={entry.period}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{ value: '改善措施', angle: -90, position: 'top', fill: '#10b981', fontSize: 10 }}
                />
              )
            ))}

            <Area
              type="monotone"
              dataKey="current"
              fill="url(#colorCurrent)"
              stroke="none"
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="current"
              stroke="#2d5a87"
              strokeWidth={3}
              dot={{ r: 5, fill: '#2d5a87', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey={(d) => d.current - d.yearOnYear}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1500}
              name="yearOnYear"
            />
            <Line
              type="monotone"
              dataKey={(d) => d.current - d.monthOnMonth}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1500}
              name="monthOnMonth"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-[#2d5a87]" />
          <span>当前利用率</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-blue-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #3b82f6 0, #3b82f6 4px, transparent 4px, transparent 8px)' }} />
          <span>同比基准</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 2px, transparent 2px, transparent 6px)' }} />
          <span>环比基准</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-purple-500 border-dashed" />
          <span>目标值</span>
        </div>
      </div>
    </div>
  );
}
