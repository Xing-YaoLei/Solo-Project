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
import { useState } from "react";
import { EntryTrendPoint } from "@/types";
import { getEntryTrend } from "@/lib/mock-data";
import clsx from "clsx";

export default function EntryTrendChart() {
  const [range, setRange] = useState<30 | 90>(30);
  const [metric, setMetric] = useState<"quantity" | "count">("quantity");
  const data = getEntryTrend(range);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-navy-900 text-sm">材料进场趋势</h3>
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
