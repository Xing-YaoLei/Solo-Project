'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface StatusPieChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
}

const COLORS_PIE = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export function StatusPieChart({ data, title }: StatusPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="w-full h-64">
      {title && <h4 className="text-sm font-medium text-slate-700 mb-2">{title}</h4>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              total > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : name
            }
            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS_PIE[index % COLORS_PIE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [`${value}人`, '人数']}
            contentStyle={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
