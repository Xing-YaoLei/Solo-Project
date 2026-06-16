"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Package, TrendingUp } from "lucide-react";
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
import { getReplenishmentRanking } from "@/lib/mock-data";
import type { ReplenishmentRank } from "@/lib/mock-data";

const rankColors = ["#0F766E", "#0D9488", "#115E59", "#14B8A6", "#134E4A", "#2DD4BF", "#0F766E", "#0D9488", "#115E59", "#14B8A6"];

export default function ReplenishmentPage() {
  const [data, setData] = useState<ReplenishmentRank[]>([]);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setData(getReplenishmentRanking(limit));
  }, [limit]);

  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const topCount = data[0]?.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary-600" />
            补货单排行
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Top 高频补货药品排行，辅助库存优化决策
          </p>
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="input-field w-32 text-sm"
        >
          <option value={10}>Top 10</option>
          <option value={15}>Top 15</option>
          <option value={20}>Top 20</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{data.length}</div>
              <div className="text-sm text-slate-500 mt-0.5">上榜药品数</div>
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
              <div className="text-2xl font-bold text-slate-900">{topCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">最高补货次数</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-warning-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center shadow-lg shadow-warning-500/20">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">累计补货次数</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">
          补货频次排行
        </h3>
        <div className="h-[480px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 60, left: 10, bottom: 10 }}
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
                dataKey="drugName"
                tick={{ fontSize: 12, fill: "#334155" }}
                axisLine={false}
                tickLine={false}
                width={160}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  fontSize: 13,
                }}
                formatter={(value: any) => [`${value} 次`, "补货次数"]}
              />
              <Bar dataKey="count" name="补货次数" radius={[0, 8, 8, 0]} barSize={22}>
                <LabelList
                  dataKey="count"
                  position="right"
                  formatter={(v: number) => `${v}次`}
                  style={{ fill: "#0F766E", fontWeight: 600, fontSize: 12 }}
                />
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={rankColors[index % rankColors.length]}
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
