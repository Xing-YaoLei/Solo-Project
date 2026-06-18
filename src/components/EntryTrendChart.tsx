"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { EntryTrendPoint } from "@/types";
import { useDashboardStore } from "@/store/dashboard";
import clsx from "clsx";

export default function EntryTrendChart() {
  const [range, setRange] = useState<30 | 90>(30);
  const [metric, setMetric] = useState<"quantity" | "count">("quantity");
  const { materialEntries, currentUserRole } = useDashboardStore();

  const data: EntryTrendPoint[] = useMemo(() => {
    const now = new Date("2026-06-18");
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - range);

    const byDate: Record<string, { count: number; quantity: number }> = {};

    for (let i = 0; i < range; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      byDate[key] = { count: 0, quantity: 0 };
    }

    materialEntries.forEach((e) => {
      const dateStr = e.entryDate;
      if (byDate[dateStr] !== undefined) {
        byDate[dateStr].count += 1;
        byDate[dateStr].quantity += e.quantity;
      }
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: `${parseInt(date.split("-")[1])}/${parseInt(date.split("-")[2])}`,
        count: vals.count,
        quantity: vals.quantity,
      }));
  }, [materialEntries, range]);

  const label = currentUserRole === "ADMIN" ? "材料进场趋势" : "材料进场趋势（负责项目）";

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-navy-900 text-sm">{label}</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setMetric("quantity")}
              className={clsx(
                "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                metric === "quantity" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900"
              )}
            >
              数量
            </button>
            <button
              onClick={() => setMetric("count")}
              className={clsx(
                "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                metric === "count" ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900"
              )}
            >
              批次
            </button>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setRange(30)}
              className={clsx(
                "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                range === 30 ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900"
              )}
            >
              30天
            </button>
            <button
              onClick={() => setRange(90)}
              className={clsx(
                "px-3 py-1 text-xs rounded-md font-medium transition-colors",
                range === 90 ? "bg-white text-navy-900 shadow-sm" : "text-slate-500 hover:text-navy-900"
              )}
            >
              90天
            </button>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1B2A4A",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#94A3B8" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              name={metric === "quantity" ? "进场数量" : "进场批次"}
              stroke="#F59E0B"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
