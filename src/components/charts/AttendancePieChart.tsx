'use client';

import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { getAttendanceStatusLabel, formatPercentage } from '@/lib/utils';

const COLORS = {
  ATTENDED: '#10b981',
  ABSENT: '#ef4444',
  POSTPONED: '#f59e0b',
  CANCELLED: '#6b7280',
};

interface AttendanceData {
  status: string;
  count: number;
  percentage: number;
}

interface AttendancePieChartProps {
  data: AttendanceData[];
}

export function AttendancePieChart({ data }: AttendancePieChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="count"
            isAnimationActive
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.status as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as AttendanceData;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="font-medium text-slate-900">
                      {getAttendanceStatusLabel(item.status)}
                    </p>
                    <p className="text-sm text-slate-600">数量: {item.count}</p>
                    <p className="text-sm text-slate-600">
                      占比: {formatPercentage(item.percentage)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            formatter={(value) => getAttendanceStatusLabel(value)}
            iconType="circle"
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
