"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { InsuranceSummary, InsuranceClaimItem } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";
import clsx from "clsx";

interface InsuranceChartProps {
  summary: InsuranceSummary;
  claims: InsuranceClaimItem[];
  lastUpdated: string;
  canViewFull: boolean;
  onRefresh?: () => void;
}

const STATUS_COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  approved: "已批准",
  settled: "已结算",
};

export function InsuranceChart({
  summary,
  claims,
  lastUpdated,
  canViewFull,
  onRefresh,
}: InsuranceChartProps) {
  const statusData = [
    { name: "待处理", value: summary.pendingCount, color: STATUS_COLORS[0] },
    { name: "已批准", value: summary.approvedCount, color: STATUS_COLORS[1] },
    { name: "已结算", value: summary.settledCount, color: STATUS_COLORS[2] },
  ].filter((d) => d.value > 0);

  const companyMap: Record<string, number> = {};
  claims.forEach((c) => {
    companyMap[c.company] = (companyMap[c.company] || 0) + 1;
  });
  const companyData = Object.entries(companyMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  return (
    <ChartCard
      title="保险理赔材料"
      subtitle="保险理赔汇总与各公司分布"
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5 text-center">
            <p className="text-2xl font-bold text-white font-display">
              {summary.totalClaims}
            </p>
            <p className="text-xs text-slate-400 mt-1">理赔总笔数</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400 font-display">
              {canViewFull ? formatCurrency(summary.totalClaimAmount) : "***"}
            </p>
            <p className="text-xs text-slate-400 mt-1">理赔总金额</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/30 border border-white/5 text-center">
            <p className="text-2xl font-bold text-blue-400 font-display">
              {canViewFull ? formatCurrency(summary.avgClaimAmount) : "***"}
            </p>
            <p className="text-xs text-slate-400 mt-1">平均理赔额</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              理赔状态分布
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => (
                      <span className="text-slate-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              各保险公司理赔笔数
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="理赔笔数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {claims.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3">
              最近理赔记录
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">车牌号</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">保险公司</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-slate-400">保单号</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">理赔金额</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-slate-400">状态</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-slate-400">申请日期</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.slice(0, 5).map((claim) => (
                    <tr key={claim.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2.5 px-3 text-sm text-slate-200">
                        {canViewFull ? claim.plateNumber : claim.plateNumber.substring(0, 3) + "****"}
                      </td>
                      <td className="py-2.5 px-3 text-sm text-slate-300">{claim.company}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-400 font-mono">
                        {canViewFull ? claim.policyNumber : claim.policyNumber.substring(0, 6) + "****"}
                      </td>
                      <td className="py-2.5 px-3 text-sm text-slate-200 text-right font-mono">
                        {canViewFull ? formatCurrency(claim.claimAmount) : "***"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={clsx(
                          "text-xs px-2 py-0.5 rounded-full",
                          claim.claimStatus === "settled" ? "bg-emerald-500/10 text-emerald-400" :
                          claim.claimStatus === "approved" ? "bg-blue-500/10 text-blue-400" :
                          "bg-amber-500/10 text-amber-400"
                        )}>
                          {STATUS_LABELS[claim.claimStatus] || claim.claimStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-sm text-slate-400 text-right">{claim.filedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ChartCard>
  );
}
