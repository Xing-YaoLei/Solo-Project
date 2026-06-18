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
import { SupplierRanking } from "@/types";

export default function SupplierRankingChart({ data }: { data: SupplierRanking[] }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">供应商信息排行</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="supplierName" tick={{ fontSize: 11, fill: "#1B2A4A" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1B2A4A",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { onTimeRate: "准时率", shortageRate: "短缺率", qualityScore: "质量评分" };
                return [`${(value * 100).toFixed(1)}%`, labels[name] || name];
              }}
            />
            <Bar dataKey="onTimeRate" fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} name="准时率" />
            <Bar dataKey="qualityScore" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12} name="质量评分" />
            <Bar dataKey="shortageRate" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={12} name="短缺率" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
