"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from "recharts";
import type { DispatchTrendPoint } from "@/types";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";

interface TrendChartProps {
  data: DispatchTrendPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date, "MM-DD"),
  }));

  return (
    <div className="glass-card p-5 gradient-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-display font-semibold">派单趋势分析</h3>
          <p className="text-xs text-muted mt-0.5">派单量与准时率趋势</p>
        </div>
        <div className="flex gap-2">
          {["7日", "15日", "30日"].map((label, i) => (
            <button
              key={label}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                i === 2
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-surface-200 text-muted border border-border hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDelayed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5C7A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#FF5C7A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E3A5F"
              vertical={false}
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={{ stroke: "#1E3A5F" }}
              tickLine={{ stroke: "#1E3A5F" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#475569", fontSize: 11 }}
              axisLine={{ stroke: "#1E3A5F" }}
              tickLine={{ stroke: "#1E3A5F" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[60, 100]}
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
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#E2E8F0", marginBottom: "8px" }}
              formatter={(value: number, name: string) => {
                const labelMap: Record<string, string> = {
                  totalOrders: "总派单量",
                  delayedOrders: "延误单量",
                  onTimeRate: "准时率",
                };
                if (name === "onTimeRate") {
                  return [formatPercent(value), labelMap[name]];
                }
                return [formatNumber(value), labelMap[name]];
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
              formatter={(value: string) => {
                const labelMap: Record<string, string> = {
                  totalOrders: "总派单量",
                  delayedOrders: "延误单量",
                  onTimeRate: "准时率",
                };
                return <span className="text-foreground/80">{labelMap[value]}</span>;
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="totalOrders"
              stroke="#00D4FF"
              strokeWidth={2}
              fill="url(#colorTotal)"
              dot={false}
              activeDot={{ r: 5, fill: "#00D4FF", stroke: "#0A1628", strokeWidth: 2 }}
            />
            <Bar
              yAxisId="left"
              dataKey="delayedOrders"
              fill="#FF5C7A"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="onTimeRate"
              stroke="#00C48C"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#00C48C", stroke: "#0A1628", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
