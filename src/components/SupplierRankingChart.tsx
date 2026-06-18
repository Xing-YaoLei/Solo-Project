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
import { useDashboardStore } from "@/store/dashboard";
import { useMemo } from "react";

export default function SupplierRankingChart() {
  const { materialEntries, batches, assignedProjectIds, currentUserRole, suppliers } = useDashboardStore();

  const data: SupplierRanking[] = useMemo(() => {
    const entries = currentUserRole === "STAFF"
      ? materialEntries.filter((e) => {
          const batch = batches.find((b) => b.id === e.batchId);
          return batch && assignedProjectIds.includes(batch.projectId);
        })
      : materialEntries;

    const supplierStats: Record<string, {
      supplierName: string;
      total: number;
      shortage: number;
      arrived: number;
      inStock: number;
      reclaimed: number;
    }> = {};

    entries.forEach((entry) => {
      const key = entry.supplierId;
      if (!supplierStats[key]) {
        supplierStats[key] = {
          supplierName: entry.supplierName,
          total: 0,
          shortage: 0,
          arrived: 0,
          inStock: 0,
          reclaimed: 0,
        };
      }
      supplierStats[key].total += 1;
      if (entry.status === "ARRIVED") supplierStats[key].arrived += 1;
      if (entry.status === "IN_STOCK") supplierStats[key].inStock += 1;
      if (entry.status === "RECLAIMED") supplierStats[key].reclaimed += 1;
      if (entry.shortageNote) supplierStats[key].shortage += 1;
    });

    return Object.entries(supplierStats)
      .map(([supplierId, stat]) => {
        const baseSupplier = suppliers.find((s) => s.id === supplierId);
        const onTimeRate = stat.total > 0 ? Math.min(1, (stat.total - stat.shortage) / stat.total * 0.95 + 0.05) : (baseSupplier?.onTimeRate || 0.9);
        const shortageRate = stat.total > 0 ? stat.shortage / stat.total : (baseSupplier?.shortageRate || 0.05);
        const qualityScore = stat.total > 0 ? Math.min(1, (stat.reclaimed + stat.inStock) / stat.total * 0.9 + 0.1) : (baseSupplier?.qualityScore || 0.85);

        return {
          supplierId,
          supplierName: stat.supplierName,
          onTimeRate: Math.round(onTimeRate * 1000) / 1000,
          shortageRate: Math.round(shortageRate * 1000) / 1000,
          qualityScore: Math.round(qualityScore * 1000) / 1000,
          totalDeliveries: stat.total,
        };
      })
      .sort((a, b) => b.onTimeRate - a.onTimeRate || b.totalDeliveries - a.totalDeliveries)
      .slice(0, 8);
  }, [materialEntries, batches, assignedProjectIds, currentUserRole, suppliers]);

  const label = currentUserRole === "ADMIN" ? "供应商信息排行" : "供应商信息排行（负责项目）";

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">{label}</h3>
      <div className="h-[280px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-400">
            暂无供应商数据
          </div>
        ) : (
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
                labelFormatter={(label: string, payload: any) => {
                  const stat = data.find((d) => d.supplierName === label);
                  return stat ? `${label} (${stat.totalDeliveries} 次)` : label;
                }}
              />
              <Bar dataKey="onTimeRate" fill="#10B981" radius={[0, 4, 4, 0]} barSize={12} name="准时率" />
              <Bar dataKey="qualityScore" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={12} name="质量评分" />
              <Bar dataKey="shortageRate" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={12} name="短缺率" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
