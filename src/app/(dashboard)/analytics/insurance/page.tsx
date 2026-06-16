"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, Receipt } from "lucide-react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from "recharts";
import { getInsuranceTrend } from "@/lib/mock-data";
import type { InsuranceTrendPoint } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function InsurancePage() {
  const [data, setData] = useState<InsuranceTrendPoint[]>([]);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    setData(getInsuranceTrend(months));
  }, [months]);

  const totalAmount = data.reduce((s, d) => s + d.amount, 0);
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const avgAmount = data.length > 0 ? Math.round(totalAmount / data.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary-600" />
            医保流水变化
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            月度医保结算金额与交易笔数趋势分析
          </p>
        </div>
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="input-field w-36 text-sm"
        >
          <option value={3}>近 3 个月</option>
          <option value={6}>近 6 个月</option>
          <option value={12}>近 12 个月</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-warning-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-500 to-warning-700 flex items-center justify-center shadow-lg shadow-warning-500/20">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-slate-500 mt-0.5">累计结算金额</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-info-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-info-500 to-info-700 flex items-center justify-center shadow-lg shadow-info-500/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
              <div className="text-sm text-slate-500 mt-0.5">累计交易笔数</div>
            </div>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(avgAmount)}</div>
              <div className="text-sm text-slate-500 mt-0.5">月均结算金额</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-6">
          月度结算趋势
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 13, fill: "#475569" }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  fontSize: 13,
                }}
                formatter={(value: any, name) => {
                  if (name === "amount") return [formatCurrency(value), "结算金额"];
                  return [value, "交易笔数"];
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-slate-600">
                    {value === "amount" ? "结算金额" : "交易笔数"}
                  </span>
                )}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="amount"
                name="amount"
                stroke="#F59E0B"
                strokeWidth={3}
                fill="url(#colorAmount)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="count"
                name="count"
                stroke="#0EA5E9"
                strokeWidth={3}
                dot={{ fill: "#0EA5E9", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
