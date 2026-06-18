"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDashboardStore } from "@/store/dashboard";
import { useMemo } from "react";

const CATEGORY_COLORS: Record<string, string> = {
  "瓷砖": "#F59E0B",
  "涂料": "#10B981",
  "管材": "#3B82F6",
  "五金": "#8B5CF6",
};

export default function RequisitionTrendChart() {
  const { requisitions, currentUserRole } = useDashboardStore();

  const data = useMemo(() => {
    const categories = Object.keys(CATEGORY_COLORS);
    const aggregated: Record<string, Record<string, number>> = {};

    requisitions.forEach((req) => {
      if (!CATEGORY_COLORS[req.category]) return;
      if (!aggregated[req.requestedAt]) aggregated[req.requestedAt] = {};
      aggregated[req.requestedAt][req.category] =
        (aggregated[req.requestedAt][req.category] || 0) + req.quantity;
    });

    return Object.entries(aggregated)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-60)
      .map(([date, cats]) => {
        const point: Record<string, string | number> = { date: date.slice(5) };
        categories.forEach((cat) => {
          point[cat] = cats[cat] || 0;
        });
        return point;
      });
  }, [requisitions]);

  const categories = Object.keys(CATEGORY_COLORS);
  const label = currentUserRole === "ADMIN" ? "领用记录变化" : "领用记录变化（负责项目）";

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">{label}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} interval={6} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1B2A4A",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            {categories.map((cat) => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stackId="1"
                stroke={CATEGORY_COLORS[cat]}
                fill={CATEGORY_COLORS[cat]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
