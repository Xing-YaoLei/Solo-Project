"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OnTimeReviewChartProps {
  data: { period: string; rate: number; target: number }[];
}

export function OnTimeReviewChart({ data }: OnTimeReviewChartProps) {
  return (
    <div className="glass-card p-5 gradient-border h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-display font-semibold">准时率复盘</h3>
          <p className="text-xs text-muted mt-0.5">周度准时率趋势对比</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-primary" />
            实际准时率
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-secondary" />
            目标线
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#00D4FF" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
            <XAxis
              dataKey="period"
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={{ stroke: "#1E3A5F" }}
              tickLine={{ stroke: "#1E3A5F" }}
            />
            <YAxis
              domain={[70, 100]}
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={{ stroke: "#1E3A5F" }}
              tickLine={{ stroke: "#1E3A5F" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F1D35",
                border: "1px solid #1E3A5F",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, "准时率"]}
            />
            <Bar
              dataKey="rate"
              fill="url(#colorRate)"
              radius={[4, 4, 0, 0]}
              name="准时率"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
