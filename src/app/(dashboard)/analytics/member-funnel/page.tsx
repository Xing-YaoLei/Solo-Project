"use client";

import { useEffect, useState } from "react";
import { Activity, Users, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { useDataStore } from "@/lib/data-store";
import type { FunnelStage } from "@/lib/mock-data";

const stageColors = ["#0F766E", "#0D9488", "#14B8A6", "#2DD4BF", "#5EEAD4"];

export default function MemberFunnelPage() {
  const store = useDataStore();
  const [data, setData] = useState<FunnelStage[]>([]);

  useEffect(() => {
    setData(store.getMemberFunnel());
  }, [store]);

  const firstCount = data[0]?.count || 1;
  const lastCount = data[data.length - 1]?.count || 0;
  const overallRate = firstCount > 0 ? Math.round((lastCount / firstCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary-600" />
          会员档案漏斗
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          从会员注册到复购转化的全链路漏斗 — 收银系统导入后自动更新转化数据
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{firstCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">注册会员总数</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-info-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-info-500 to-info-700 flex items-center justify-center shadow-lg shadow-info-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{overallRate}%</div>
              <div className="text-sm text-slate-500 mt-0.5">注册到复购转化率</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-warning-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center shadow-lg shadow-warning-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{lastCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">复购转化会员</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">转化漏斗</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 20, right: 80, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="stage"
                tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  fontSize: 13,
                }}
                formatter={(value: any, name) => {
                  if (name === "count") return [value, "人数"];
                  return [`${value}%`, "转化率"];
                }}
              />
              <Bar dataKey="count" name="人数" radius={[0, 10, 10, 0]} barSize={36}>
                <LabelList
                  dataKey="conversionRate"
                  position="right"
                  formatter={(v: number) => `${v}%`}
                  style={{ fill: "#0F766E", fontWeight: 600, fontSize: 13 }}
                />
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={stageColors[index % stageColors.length]}
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
