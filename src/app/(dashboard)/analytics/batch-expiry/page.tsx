"use client";

import { useEffect, useState } from "react";
import { Pill, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { getBatchExpiryData } from "@/lib/mock-data";
import type { BatchExpiryPoint } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const rangeColors: Record<string, string> = {
  "7天内": "#EF4444",
  "8-30天": "#F59E0B",
  "31-60天": "#14B8A6",
  "61-90天": "#0EA5E9",
  "90天以上": "#94A3B8",
};

export default function BatchExpiryPage() {
  const [data, setData] = useState<BatchExpiryPoint[]>([]);

  useEffect(() => {
    setData(getBatchExpiryData());
  }, []);

  const urgentCount = data.filter((d) => d.range === "7天内" || d.range === "8-30天").reduce((s, d) => s + d.count, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const safeCount = data.filter((d) => d.range === "90天以上").reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Pill className="w-6 h-6 text-primary-600" />
          批号效期分布
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          按距离效期的时间区间统计药品批次数量，预警临期风险
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{urgentCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">临期批次（30天内）</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">库存批次总数</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-risk-low/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-risk-low to-emerald-700 flex items-center justify-center shadow-lg shadow-risk-low/20">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{safeCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">安全批次（90天以上）</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">
          效期区间分布
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 13, fill: "#475569" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  fontSize: 13,
                }}
                cursor={{ fill: "rgba(15, 118, 110, 0.05)" }}
              />
              <Legend
                formatter={() => <span className="text-sm text-slate-600">批次数量</span>}
              />
              <Bar dataKey="count" name="批次数量" radius={[10, 10, 0, 0]} barSize={60}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={rangeColors[entry.range]}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
