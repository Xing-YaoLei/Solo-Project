'use client';

import {
  Funnel,
  FunnelChart as RechartsFunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { FunnelDataPoint } from '@/types';
import { formatPercentage } from '@/lib/utils';

interface FunnelChartProps {
  data: FunnelDataPoint[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  const total = data[0]?.value || 0;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as FunnelDataPoint;
                const rate = total > 0 ? item.value / total : 0;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-600">数量: {item.value}</p>
                    <p className="text-sm text-slate-600">
                      占比: {formatPercentage(rate)}
                    </p>
                    {total > 0 && item.value < total && (
                      <p className="text-sm text-slate-500">
                        转化率: {formatPercentage(item.value / total)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive
            animationDuration={800}
          >
            <LabelList
              position="right"
              fill="#334155"
              stroke="none"
              dataKey="name"
              className="text-sm"
            />
            <LabelList
              position="center"
              fill="#ffffff"
              stroke="none"
              dataKey="value"
              className="text-sm font-semibold"
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
