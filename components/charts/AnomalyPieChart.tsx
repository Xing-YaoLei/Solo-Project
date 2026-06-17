"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { AnomalyDistribution } from "@/types";

interface AnomalyPieChartProps {
  data: AnomalyDistribution[];
}

export function AnomalyPieChart({ data }: AnomalyPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="glass-card p-5 gradient-border h-full">
      <div className="mb-4">
        <h3 className="text-base font-display font-semibold">异常类型分布</h3>
        <p className="text-xs text-muted mt-0.5">共 {total} 单异常</p>
      </div>

      <div className="h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="cursor-pointer transition-all hover:opacity-80"
                  style={{
                    filter: `drop-shadow(0 0 6px ${entry.color}33)`,
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F1D35",
                border: "1px solid #1E3A5F",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, _name: string, props?: { payload?: AnomalyDistribution }) => {
                const payload = props?.payload;
                const name = payload?.name ?? "";
                return [
                  `${value} 单 (${((value / total) * 100).toFixed(1)}%)`,
                  name,
                ];
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value: string) => (
                <span className="text-foreground/80">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-display font-bold text-foreground">{total}</span>
          <span className="text-xs text-muted mt-0.5">异常总数</span>
        </div>
      </div>
    </div>
  );
}
