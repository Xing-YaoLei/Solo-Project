"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FunnelStage } from "@/types";
import { useDashboardStore } from "@/store/dashboard";
import { useMemo } from "react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#F97316", "#EF4444"];

export default function FunnelChart() {
  const { materialEntries, currentUserRole } = useDashboardStore();

  const data: FunnelStage[] = useMemo(() => {
    const total = materialEntries.length;
    if (total === 0) return [];

    const arrived = materialEntries.filter((e) => e.status === "ARRIVED" || e.status === "IN_STOCK" || e.status === "RECLAIMED").length;
    const inStock = materialEntries.filter((e) => e.status === "IN_STOCK" || e.status === "RECLAIMED").length;
    const reclaimed = materialEntries.filter((e) => e.status === "RECLAIMED").length;
    const expiring = materialEntries.filter((e) => e.expiryDate && new Date(e.expiryDate) < new Date("2026-09-01")).length;

    return [
      { stage: "进场登记", count: total, conversionRate: 100 },
      { stage: "在库管理", count: arrived, conversionRate: Math.round((arrived / total) * 100) },
      { stage: "已领用", count: inStock, conversionRate: Math.round((inStock / total) * 100) },
      { stage: "效期预警", count: reclaimed, conversionRate: Math.round((reclaimed / total) * 100) },
      { stage: "过期处理", count: expiring, conversionRate: Math.round((expiring / total) * 100) },
    ];
  }, [materialEntries]);

  const label = currentUserRole === "ADMIN" ? "批次效期漏斗" : "批次效期漏斗（负责项目）";

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">{label}</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fontSize: 12, fill: "#1B2A4A" }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1B2A4A",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value: number, _: string, props: any) => [
                `${value} 条 (转化率 ${props?.payload?.conversionRate || 0}%)`,
                "数量",
              ]}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
