"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import FunnelChart from "@/components/FunnelChart";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import { ShoppingCart, TrendingUp, DollarSign, Users, Calendar, BarChart3 } from "lucide-react";
import { subDays, format } from "date-fns";

export default function SecondaryConsumptionPage() {
  const [compareType, setCompareType] = useState<"date" | "area">("date");

  const funnelData = [
    { stage: "浏览用户", count: 25680, rate: 100 },
    { stage: "访问用户", count: 18420, rate: 71.7 },
    { stage: "下单用户", count: 4386, rate: 23.8 },
    { stage: "支付完成", count: 4167, rate: 22.9 },
  ];

  const dateComparison = [
    { date: "06-14", amount: 128500, rate: 22.3, orders: 320 },
    { date: "06-15", amount: 142300, rate: 24.1, orders: 356 },
    { date: "06-16", amount: 156800, rate: 25.7, orders: 389 },
    { date: "06-17", amount: 138400, rate: 23.5, orders: 345 },
    { date: "06-18", amount: 172500, rate: 27.8, orders: 432 },
    { date: "06-19", amount: 198600, rate: 30.2, orders: 498 },
    { date: "06-20", amount: 165200, rate: 26.4, orders: 412 },
  ];

  const areaComparison = [
    { area: "东区", amount: 425600, rate: 28.5, orders: 1064 },
    { area: "西区", amount: 318200, rate: 22.3, orders: 796 },
    { area: "南区", amount: 256800, rate: 24.1, orders: 642 },
    { area: "北区", amount: 189400, rate: 19.8, orders: 473 },
    { area: "中心区", amount: 512300, rate: 31.2, orders: 1281 },
  ];

  const chartData = compareType === "date" ? dateComparison : areaComparison;
  const dataKey = compareType === "date" ? "date" : "area";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              二消转化报表
            </h2>
            <p className="text-sm text-slate-400">
              多维度分析二次消费转化情况，优化运营策略
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 glass-card">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300">近7日</span>
            </div>

            <div className="flex glass-card rounded-lg overflow-hidden">
              {[
                { key: "date", label: "按日期对比" },
                { key: "area", label: "按区域对比" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCompareType(item.key as any)}
                  className={`px-4 py-2 text-sm transition-colors ${
                    compareType === item.key
                      ? "bg-primary-500/20 text-primary-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="二消总额"
            value="¥128.5万"
            change={15.7}
            icon={<DollarSign size={22} />}
            color="accent"
            delay={0}
          />
          <StatCard
            title="二消订单数"
            value="2,752"
            change={12.3}
            icon={<ShoppingCart size={22} />}
            color="primary"
            delay={0.1}
          />
          <StatCard
            title="二消转化率"
            value="23.8%"
            change={-2.1}
            icon={<TrendingUp size={22} />}
            color="emerald"
            delay={0.2}
          />
          <StatCard
            title="客单价"
            value="¥467"
            change={5.8}
            icon={<Users size={22} />}
            color="violet"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">
              <TrendingUp size={18} className="text-emerald-400" />
              转化漏斗
            </h3>
            <FunnelChart data={funnelData} />
          </div>

          <div className="col-span-2 glass-card p-5">
            <h3 className="section-title mb-4">
              <BarChart3 size={18} className="text-primary-400" />
              {compareType === "date" ? "每日消费趋势" : "各区域消费对比"}
            </h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="amountGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#f97316"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="#f97316"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />

                  <XAxis
                    dataKey={dataKey}
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />

                  <YAxis
                    yAxisId="left"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    tickFormatter={(value) => `${value}%`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30, 41, 59, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      backdropFilter: "blur(10px)",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />

                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-slate-300">{value}</span>
                    )}
                  />

                  <Bar
                    yAxisId="left"
                    dataKey="amount"
                    name="消费金额"
                    fill="url(#amountGradient)"
                    stroke="#f97316"
                    strokeWidth={2}
                    radius={[4, 4, 0, 0]}
                  />

                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rate"
                    name="转化率"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-4">
            <ShoppingCart size={18} className="text-violet-400" />
            详细数据
          </h3>
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>{compareType === "date" ? "日期" : "区域"}</th>
                <th>消费金额</th>
                <th>订单数</th>
                <th>客单价</th>
                <th>转化率</th>
                <th>同比</th>
                <th>环比</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="font-medium text-white">
                    {item[dataKey as keyof typeof item]}
                  </td>
                  <td className="font-mono text-accent-400">
                    ¥{item.amount.toLocaleString()}
                  </td>
                  <td className="font-mono">{item.orders.toLocaleString()}</td>
                  <td className="font-mono">
                    ¥{Math.round(item.amount / item.orders)}
                  </td>
                  <td>
                    <span className="badge badge-info">{item.rate}%</span>
                  </td>
                  <td className="text-emerald-400">+{Math.floor(Math.random() * 20) + 5}%</td>
                  <td className={Math.random() > 0.5 ? "text-emerald-400" : "text-red-400"}>
                    {Math.random() > 0.5 ? "+" : "-"}
                    {Math.floor(Math.random() * 10)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
