"use client";

import { useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  TrendingUp,
  Store,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useDataStore } from "@/lib/data-store";
import type { DashboardOverview } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

const riskColors = {
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  trend?: string;
  trendPositive?: boolean;
}

function StatCard({ label, value, icon: Icon, gradient, trend, trendPositive }: StatCardProps) {
  return (
    <div className="card p-5 relative overflow-hidden group hover:shadow-card-hover transition-shadow animate-slide-up">
      <div
        className={cn(
          "absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10 blur-2xl",
          gradient
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              gradient
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium flex items-center gap-1",
                trendPositive ? "text-risk-low" : "text-risk-high"
              )}
            >
              <TrendingUp
                className={cn(
                  "w-3 h-3",
                  !trendPositive && "rotate-180"
                )}
              />
              {trend}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const getOverview = useDataStore((s) => s.getDashboardOverview);

  useEffect(() => {
    setData(getOverview());
  }, [getOverview]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">总览仪表盘</h1>
        <p className="text-sm text-slate-500 mt-1">
          今日慢病会员监测总览 · {new Date().toLocaleDateString("zh-CN")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="慢病会员总数"
          value={data.totalChronicMembers.toString()}
          icon={Users}
          gradient="bg-gradient-to-br from-primary-500 to-primary-700"
          trend="+12 本月"
          trendPositive
        />
        <StatCard
          label="高风险会员"
          value={data.highRiskCount.toString()}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-red-500 to-red-700"
          trend="+3 较上周"
          trendPositive={false}
        />
        <StatCard
          label="回访完成率"
          value={`${data.followUpCompletionRate}%`}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-info-500 to-info-700"
          trend="+5% 较上月"
          trendPositive
        />
        <StatCard
          label="本月医保流水"
          value={formatCurrency(data.monthlyInsuranceAmount)}
          icon={Wallet}
          gradient="bg-gradient-to-br from-warning-500 to-warning-700"
          trend="+8.2% YoY"
          trendPositive
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">
              近30天慢病风险趋势
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-risk-high" />
                高风险
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-risk-medium" />
                中风险
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-risk-low" />
                低风险
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.riskTrend}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskColors.high} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={riskColors.high} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskColors.medium} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={riskColors.medium} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={riskColors.low} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={riskColors.low} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  name="高风险"
                  stroke={riskColors.high}
                  fillOpacity={1}
                  fill="url(#colorHigh)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="medium"
                  name="中风险"
                  stroke={riskColors.medium}
                  fillOpacity={1}
                  fill="url(#colorMedium)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="low"
                  name="低风险"
                  stroke={riskColors.low}
                  fillOpacity={1}
                  fill="url(#colorLow)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-4 h-4 text-slate-600" />
            <h3 className="text-base font-semibold text-slate-900">
              门店回访完成率排行
            </h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.storeRanking}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="storeName"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`, "完成率"]}
                />
                <Bar dataKey="completionRate" radius={[0, 6, 6, 0]} barSize={24}>
                  {data.storeRanking.map((_, index) => (
                    <Cell
                      key={index}
                      fill={index === 0 ? "#0D9488" : index === 1 ? "#14B8A6" : "#5EEAD4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
