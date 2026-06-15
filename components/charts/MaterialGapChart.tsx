'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { FileWarning } from 'lucide-react';
import type { MaterialGapData } from '@/types';

interface MaterialGapChartProps {
  data: MaterialGapData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip min-w-56">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">总申请数:</span>
            <span className="font-mono font-medium text-gray-900">{data.totalApplications}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">材料完整:</span>
            <span className="font-mono font-medium text-emerald-600">{data.completeApplications}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">材料缺失:</span>
            <span className="font-mono font-medium text-red-600">{data.missingApplications}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-1">缺失材料类型:</p>
          <div className="space-y-0.5">
            {data.missingTypes.map((type: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-500">{type.type}:</span>
                <span className="font-mono text-gray-700">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function MaterialGapChart({ data }: MaterialGapChartProps) {
  const maxTotal = Math.max(...data.map(d => d.totalApplications));
  const gapThreshold = maxTotal * 0.15;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <FileWarning className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-800">材料缺失造成的申请缺口</h3>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="rect"
              formatter={(value) => (
                <span className="text-sm text-gray-600">
                  {value === 'completeApplications' ? '材料完整' : '材料缺失'}
                </span>
              )}
            />

            <ReferenceLine
              y={gapThreshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: '警戒线', position: 'right', fill: '#ef4444', fontSize: 11 }}
            />

            <Bar
              dataKey="completeApplications"
              stackId="a"
              fill="#10b981"
              radius={[0, 0, 0, 0]}
              animationDuration={1500}
            />
            <Bar
              dataKey="missingApplications"
              stackId="a"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.missingApplications > gapThreshold ? '#ef4444' : '#f59e0b'}
                  className={entry.missingApplications > gapThreshold ? 'animate-breathe' : ''}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {['成绩单', '申请表', '身份证明', '复核理由书'].map((type, idx) => {
          const totalMissing = data.reduce(
            (sum, d) => sum + (d.missingTypes.find(t => t.type === type)?.count || 0),
            0
          );
          const colors = ['bg-red-50 border-red-200 text-red-700', 'bg-amber-50 border-amber-200 text-amber-700', 'bg-blue-50 border-blue-200 text-blue-700', 'bg-purple-50 border-purple-200 text-purple-700'];
          return (
            <div key={type} className={`p-3 rounded-lg border ${colors[idx]}`}>
              <div className="text-xs mb-1 opacity-75">{type}缺失</div>
              <div className="text-xl font-bold font-mono">{totalMissing}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
