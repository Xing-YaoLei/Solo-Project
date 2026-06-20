import { useMemo } from 'react';
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
import type { OccupancyDataPoint } from '../../types';

interface OccupancyChartProps {
  data: OccupancyDataPoint[];
  targetOccupancy: number;
}

const PHASE_LABELS: Record<string, string> = {
  RULES: '规则阶段',
  LOCKING: '锁座阶段',
  CHECKING: '核销阶段',
  REVIEW: '复盘阶段',
};

const DISPUTE_KEYWORDS = ['争议前', '退票重选'];

function isDisputePoint(label: string) {
  return DISPUTE_KEYWORDS.some((k) => label.includes(k));
}

export function OccupancyChart({ data, targetOccupancy }: OccupancyChartProps) {
  const chartData = useMemo(() => {
    const enriched = data.map((d, idx) => ({
      ...d,
      index: idx,
      phaseLabel: PHASE_LABELS[d.phase] || d.phase,
      isDispute: isDisputePoint(d.timeLabel),
    }));
    return enriched.length > 0 ? enriched : [
      { timeLabel: '初始', currentOccupancy: 0, optimalOccupancy: 0, phase: 'RULES' as const, phaseLabel: '规则阶段', index: 0, timestamp: Date.now(), isDispute: false },
    ];
  }, [data]);

  const disputeRanges = useMemo(() => {
    const ranges: { start: number; end: number }[] = [];
    let start = -1;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].isDispute) {
        if (start === -1) start = i;
      } else {
        if (start !== -1) {
          ranges.push({ start, end: i - 1 });
          start = -1;
        }
      }
    }
    if (start !== -1) ranges.push({ start, end: chartData.length - 1 });
    return ranges;
  }, [chartData]);

  return (
    <div className="w-full rounded-2xl bg-slate-800/50 border border-slate-700/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-lg mb-1">上座率变化趋势</h3>
          <p className="text-xs text-slate-400">对比当前决策与理论最优上座率</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-400">当前上座率</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-400">理论最优</span>
          </div>
          {disputeRanges.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-rose-500" />
              <span className="text-slate-400">退票争议重选</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#F1F5F9',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === 'currentOccupancy' ? '当前上座率' : '最优上座率',
              ]}
              labelFormatter={(label, payload) => {
                const d = payload?.[0]?.payload;
                return d ? `${label} · ${d.phaseLabel}` : label;
              }}
            />
            <ReferenceLine
              y={targetOccupancy}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `目标 ${targetOccupancy}%`,
                position: 'right',
                fill: '#F59E0B',
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="currentOccupancy"
              fill="url(#currentGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="currentOccupancy"
              stroke="#10B981"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload?.isDispute) {
                  return (
                    <g key={`dot-${payload.index}`}>
                      <circle cx={cx} cy={cy} r={8} fill="#F43F5E" fillOpacity={0.15} />
                      <circle cx={cx} cy={cy} r={5} fill="#F43F5E" stroke="#0F172A" strokeWidth={2} />
                    </g>
                  );
                }
                return <circle key={`dot-${payload?.index ?? 0}`} cx={cx} cy={cy} r={5} fill="#10B981" stroke="#0F172A" strokeWidth={2} />;
              }}
              activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: '#0F172A' }}
            />
            <Line
              type="monotone"
              dataKey="optimalOccupancy"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
