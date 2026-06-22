'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function TrendAreaChart({ data }: { data: Array<{ week: string; created: number; closed: number }> }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="c-created" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="c-closed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="created" name="新增整改" stroke="#1e3a8a" strokeWidth={2} fill="url(#c-created)" />
          <Area type="monotone" dataKey="closed" name="已关闭" stroke="#059669" strokeWidth={2} fill="url(#c-closed)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
