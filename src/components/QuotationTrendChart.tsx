"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { QuotationTrendItem } from "@/types";
import { formatCurrency, formatNumber } from "@/utils/format";

interface QuotationTrendChartProps {
  data: QuotationTrendItem[];
  lastUpdated: string;
  canViewFullAmount: boolean;
  onRefresh?: () => void;
}

export function QuotationTrendChart({
  data,
  lastUpdated,
  canViewFullAmount,
  onRefresh,
}: QuotationTrendChartProps) {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [activeTab, setActiveTab] = useState<"amount" | "count">("amount");

  const formattedData = data.map((item) => ({
    ...item,
    date: item.date.slice(5),
    displayAmount: canViewFullAmount ? item.totalAmount : 0,
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
              <span className="text-white font-medium">
                {entry.name === "工单数量"
                  ? formatNumber(entry.value) + " 单"
                  : canViewFullAmount
                  ? formatCurrency(entry.value)
                  : "***"}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="报价单趋势"
      subtitle="工单数量与报价金额变化趋势"
      lastUpdated={lastUpdated}
      onRefresh={onRefresh}
      action={
        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                period === p
                  ? "bg-industrial-500 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {p === "day" ? "日" : p === "week" ? "周" : "月"}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab("amount")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "amount"
              ? "bg-industrial-500/20 text-industrial-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          金额趋势
        </button>
        <button
          onClick={() => setActiveTab("count")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "count"
              ? "bg-blue-500/20 text-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          工单数量
        </button>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "amount" ? (
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) =>
                  canViewFullAmount
                    ? value >= 10000
                      ? `${(value / 10000).toFixed(1)}万`
                      : value
                    : "***"
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="totalAmount"
                name="报价金额"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          ) : (
            <BarChart data={formattedData}>
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
              <Bar
                dataKey="orderCount"
                name="工单数量"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
