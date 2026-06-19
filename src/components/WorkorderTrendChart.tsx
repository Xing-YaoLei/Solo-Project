'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDashboardStore } from '@/store/dashboard';

export function WorkorderTrendChart() {
  const { workorderTrend, isLoading } = useDashboardStore();

  if (isLoading || workorderTrend.length === 0) {
    return (
      <div className="h-[340px] animate-pulse rounded-xl border border-industrial-700 bg-industrial-800" />
    );
  }

  const displayData = workorderTrend.slice(-14).map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="rounded-xl border border-industrial-700 bg-gradient-to-br from-industrial-800/80 to-industrial-900/80 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold tracking-wide text-white">工单项目趋势</h3>
          <p className="mt-0.5 text-[11px] text-industrial-400">近14天工单数量、完成情况与返修率</p>
        </div>
        <div className="flex gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-risk-info" />
            <span className="text-industrial-300">总工单</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-risk-success" />
            <span className="text-industrial-300">已完成</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-risk-danger" />
            <span className="text-industrial-300">返修率(%)</span>
          </span>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 20]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              labelStyle={{ color: '#94A3B8', marginBottom: '6px' }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  total: '总工单',
                  completed: '已完成',
                  reworkRate: '返修率',
                };
                return [
                  name === 'reworkRate' ? `${value}%` : value,
                  labels[name] || name,
                ];
              }}
            />
            <Bar yAxisId="left" dataKey="total" fill="url(#totalGrad)" radius={[4, 4, 0, 0]} barSize={18} />
            <Bar yAxisId="left" dataKey="completed" fill="url(#completedGrad)" radius={[4, 4, 0, 0]} barSize={18} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="reworkRate"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ fill: '#EF4444', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
