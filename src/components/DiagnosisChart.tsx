"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, RotateCcw, User, Calendar } from "lucide-react";
import { ChartCard } from "./ChartCard";
import { DiagnosisAbnormalItem, DiagnosisTrendItem } from "@/types";
import {
  getSeverityColor,
  getSeverityBgColor,
  formatDate,
} from "@/utils/format";
import clsx from "clsx";

interface DiagnosisChartProps {
  abnormalItems: DiagnosisAbnormalItem[];
  trend: DiagnosisTrendItem[];
  lastUpdated: string;
  onRefresh?: () => void;
}

export function DiagnosisChart({
  abnormalItems,
  trend,
  lastUpdated,
  onRefresh,
}: DiagnosisChartProps) {
  const [viewMode, setViewMode] = useState<"trend" | "list">("trend");
  const [severityFilter, setSeverityFilter] = useState<"all" | "low" | "medium" | "high">(
    "all"
  );

  const filteredItems =
    severityFilter === "all"
      ? abnormalItems
      : abnormalItems.filter((item) => item.severity === severityFilter);

  const formattedTrend = trend.map((item) => ({
    ...item,
    date: item.date.slice(5),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-slate-300 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="text-white font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const severityLabels = {
    low: "低",
    medium: "中",
    high: "高",
  };

  return (
    <ChartCard
      title="诊断结果异常标注"
      subtitle="异常诊断项统计与趋势分析"
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      action={
        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode("trend")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === "trend"
                ? "bg-industrial-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            趋势
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === "list"
                ? "bg-industrial-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            列表
          </button>
        </div>
      }
    >
      {viewMode === "trend" ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "10px" }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="abnormalCount"
                name="异常数量"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ fill: "#f43f5e", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="reworkCount"
                name="返修数量"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-400">严重程度:</span>
            {(["all", "high", "medium", "low"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-full transition-all",
                  severityFilter === s
                    ? s === "high"
                      ? "bg-rose-500/20 text-rose-400"
                      : s === "medium"
                      ? "bg-orange-500/20 text-orange-400"
                      : s === "low"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-600/50 text-slate-200"
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-200"
                )}
              >
                {s === "all" ? "全部" : severityLabels[s]}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={clsx(
                  "p-4 rounded-xl border transition-all",
                  item.severity === "high"
                    ? "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
                    : item.severity === "medium"
                    ? "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40"
                    : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        "p-2 rounded-lg mt-0.5",
                        getSeverityBgColor(item.severity)
                      )}
                    >
                      <AlertTriangle
                        className={clsx(
                          "w-4 h-4",
                          getSeverityColor(item.severity)
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {item.diagnosisItem}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.technician}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        getSeverityBgColor(item.severity),
                        getSeverityColor(item.severity)
                      )}
                    >
                      {severityLabels[item.severity]}
                    </span>
                    {item.isRework && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400">
                        <RotateCcw className="w-3 h-3" />
                        返修
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-500">
                    车辆: {item.vehiclePlate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
