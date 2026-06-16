'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface FunnelChartProps {
  data: Array<{
    stage: string;
    stageName: string;
    patientCount: number;
    missedCount: number;
    revisitRate: number;
    conversionRate: number;
  }>;
}

const COLORS = [
  '#0ea5e9',
  '#0284c7',
  '#0369a1',
  '#075985',
  '#0c4a6e',
  '#164e63',
  '#134e4a',
];

export function FunnelChart({ data }: FunnelChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    fill: COLORS[data.indexOf(item) % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{item.stageName}</p>
          <p className="text-sm text-slate-600">患者数: {item.patientCount}</p>
          <p className="text-sm text-slate-600">爽约数: {item.missedCount}</p>
          <p className="text-sm text-slate-600">复诊率: {item.revisitRate.toFixed(1)}%</p>
          <p className="text-sm text-slate-600">转化率: {item.conversionRate.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 80, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis
            type="category"
            dataKey="stageName"
            stroke="#64748b"
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="patientCount" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
            <LabelList
              dataKey="patientCount"
              position="right"
              formatter={(value: number) => `${value}人`}
              style={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
