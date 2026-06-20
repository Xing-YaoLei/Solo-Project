"use client";

import { useState, useEffect } from "react";
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
import { ShoppingCart, TrendingUp, DollarSign, Users, Calendar, BarChart3, Loader2 } from "lucide-react";
import { subDays, format } from "date-fns";

interface FunnelItem {
  stage: string;
  count: number;
  rate: number;
}

interface ChartItem {
  label: string;
  amount: number;
  rate: number;
  orders: number;
  yoyGrowth: number;
  momGrowth: number;
}

interface KpiData {
  totalAmount: number;
  orderCount: number;
  conversionRate: number;
  avgPrice: number;
  totalAmountGrowth: number;
  orderCountGrowth: number;
  conversionRateGrowth: number;
  avgPriceGrowth: number;
}

export default function SecondaryConsumptionPage() {
  const [compareType, setCompareType] = useState<"date" | "area">("date");
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
        const end = format(new Date(), "yyyy-MM-dd");
        const res = await fetch(
          `/api/secondary-consumption?startDate=${start}&endDate=${end}&compareType=${compareType}`
        );
        if (res.ok) {
          const data = await res.json();
          setFunnel(data.funnel || []);
          setChartData(
            (data.comparison || []).map((c: any) => ({
              label: c.label,
              amount: c.amount,
              rate: c.conversionRate,
              orders: c.orderCount,
              yoyGrowth: c.yoyGrowth ?? 0,
              momGrowth: c.momGrowth ?? 0,
            }))
          );
          setKpi(data.kpi || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [compareType]);

  const totalAmount = kpi?.totalAmount ?? chartData.reduce((s, d) => s + d.amount, 0);
  const totalOrders = kpi?.orderCount ?? chartData.reduce((s, d) => s + d.orders, 0);
  const avgRate = kpi?.conversionRate ?? (chartData.length > 0
    ? chartData.reduce((s, d) => s + d.rate, 0) / chartData.length
    : 0);
  const avgPrice = kpi?.avgPrice ?? (totalOrders > 0 ? totalAmount / totalOrders : 0);

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
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center justify-center h-24">
                <Loader2 size={20} className="animate-spin text-slate-500" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="二消总额"
                value={`¥${(totalAmount / 10000).toFixed(1)}万`}
                change={kpi?.totalAmountGrowth ?? 0}
                icon={<DollarSign size={22} />}
                color="accent"
                delay={0}
              />
              <StatCard
                title="二消订单数"
                value={totalOrders.toLocaleString()}
                change={kpi?.orderCountGrowth ?? 0}
                icon={<ShoppingCart size={22} />}
                color="primary"
                delay={0.1}
              />
              <StatCard
                title="二消转化率"
                value={`${avgRate.toFixed(1)}%`}
                change={kpi?.conversionRateGrowth ?? 0}
                icon={<TrendingUp size={22} />}
                color="emerald"
                delay={0.2}
              />
              <StatCard
                title="客单价"
                value={`¥${Math.round(avgPrice)}`}
                change={kpi?.avgPriceGrowth ?? 0}
                icon={<Users size={22} />}
                color="violet"
                delay={0.3}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">
              <TrendingUp size={18} className="text-emerald-400" />
              转化漏斗
            </h3>
            {funnel.length > 0 ? (
              <FunnelChart data={funnel} />
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              暂无数据
            </div>
            )}
          </div>

          <div className="col-span-2 glass-card p-5">
            <h3 className="section-title mb-4">
              <BarChart3 size={18} className="text-primary-400" />
              {compareType === "date" ? "每日消费趋势" : "各区域消费对比"}
            </h3>
            <div className="h-[320px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={28} className="animate-spin text-slate-500" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  暂无数据
                </div>
              ) : (
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
                      dataKey="label"
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
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
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
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="section-title mb-4">
            <ShoppingCart size={18} className="text-violet-400" />
            详细数据
          </h3>
          {chartData.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">暂无数据</p>
          ) : (
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
                    <td className="font-medium text-white">{item.label}</td>
                    <td className="font-mono text-accent-400">
                      ¥{item.amount.toLocaleString()}
                    </td>
                    <td className="font-mono">{item.orders.toLocaleString()}</td>
                    <td className="font-mono">
                      ¥{item.orders > 0 ? Math.round(item.amount / item.orders) : 0}
                    </td>
                    <td>
                      <span className="badge badge-info">{item.rate.toFixed(1)}%</span>
                    </td>
                    <td className={item.yoyGrowth >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {item.yoyGrowth >= 0 ? "+" : ""}{item.yoyGrowth.toFixed(1)}%
                    </td>
                    <td className={item.momGrowth >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {item.momGrowth >= 0 ? "+" : ""}{item.momGrowth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
