'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  FunnelChart,
  Funnel,
  LabelList,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { formatNumber } from '@/lib/utils';

const DISPATCH_COLORS = ['#1e3a8a', '#2563eb', '#0891b2', '#d97706', '#7c3aed'];
const FUNNEL_COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

export function DispatchPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
          >
            {data.map((e, i) => (
              <Cell key={i} fill={DISPATCH_COLORS[i % DISPATCH_COLORS.length]} />
            ))}
            <LabelList
              type="outer"
              dataKey="value"
              formatter={(v: any) => formatNumber(v as number)}
              position="right"
              style={{ fontSize: 11 }}
            />
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusFunnelChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <FunnelChart>
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Funnel dataKey="value" data={data} isAnimationActive>
            {data.map((e, i) => (
              <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
            ))}
            <LabelList
              position="right"
              fill="#fff"
              stroke="none"
              dataKey="name"
              style={{ fontSize: 12, fontWeight: 500 }}
            />
            <LabelList
              position="center"
              fill="#fff"
              stroke="none"
              dataKey="value"
              formatter={(v: any) => String(v)}
              style={{ fontSize: 14, fontWeight: 600 }}
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReviewCommentsBarChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 120, right: 30 }}>
          <CartesianGrid stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <defs>
            <linearGradient id="barReview" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="url(#barReview)" barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CloseReasonsAreaChart({
  reasons,
  weeks,
}: {
  reasons: string[];
  weeks: Array<{ week: string } & Record<string, number>>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={weeks} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="a3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="week" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          {reasons.map((r, i) => (
            <Area
              key={r}
              type="monotone"
              stackId="1"
              dataKey={r}
              name={r}
              stroke={['#1e3a8a', '#059669', '#d97706'][i]}
              strokeWidth={2}
              fill={[`url(#a1)`, `url(#a2)`, `url(#a3)`][i]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
