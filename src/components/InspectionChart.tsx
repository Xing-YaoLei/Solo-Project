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
import { InspectionSummary, InspectionIssueItem } from "@/types";
import { formatPercent, formatNumber } from "@/utils/format";

interface InspectionChartProps {
  summary: InspectionSummary;
  issues: InspectionIssueItem[];
  lastUpdated: string;
  canViewDetail: boolean;
  onRefresh?: () => void;
}

const COLORS = ["#10b981", "#f43f5e"];

export function InspectionChart({
  summary,
  issues,
  lastUpdated,
  canViewDetail,
  onRefresh,
}: InspectionChartProps) {
  const pieData = [
    { name: "通过", value: summary.passed },
    { name: "未通过", value: summary.failed },
  ];

  const issuesData = issues.map((issue) => ({
    ...issue,
    percentage: issue.percentage * 100,
  }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-white font-medium">
            {payload[0].name}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            数量:{" "}
            <span className="text-white">
              {formatNumber(payload[0].value)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-sm text-slate-400 mt-1">
            数量:{" "}
            <span className="text-white">
              {formatNumber(payload[0].payload.count)}
            </span>
          </p>
          <p className="text-sm text-slate-400">
            占比:{" "}
            <span className="text-white">
              {payload[0].value.toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="质检照片构成"
      subtitle="质检通过率与问题类型分布"
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
    >
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col items-center">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-center">
            <p className="text-3xl font-bold text-emerald-400 font-mono font-display">
              {formatPercent(summary.passRate, 1)}
            </p>
            <p className="text-sm text-slate-400 mt-1">质检通过率</p>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-400">通过</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-slate-400">未通过</span>
            </div>
          </div>
        </div>

        <div>
          {canViewDetail ? (
            <>
              <h4 className="text-sm font-medium text-slate-300 mb-3">
                问题类型分布
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={issuesData}
                    layout="vertical"
                    margin={{ left: 0, right: 10 }}
                  >
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis
                      type="category"
                      dataKey="type"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="percentage"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-500 text-sm">暂无权限查看详情</p>
                <p className="text-slate-600 text-xs mt-1">
                  请联系管理员获取更多权限
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
