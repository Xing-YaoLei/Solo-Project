"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import DateRangePicker from "@/components/DateRangePicker";
import SubsidyTrendChart from "@/components/charts/SubsidyTrendChart";
import RegionChart from "@/components/charts/RegionChart";
import DurationChart from "@/components/charts/DurationChart";
import {
  generateSubsidyTrendData,
  generateRegionData,
  generateDurationData,
  generateYoYComparison,
  generateMoMComparison,
} from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const [dateRange, setDateRange] = useState("30d");
  const [trendData, setTrendData] = useState<any[]>([]);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [durationData, setDurationData] = useState<any[]>([]);
  const [yoyData, setYoyData] = useState<any>(null);
  const [momData, setMomData] = useState<any>(null);

  useEffect(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 30;
    setTrendData(generateSubsidyTrendData(days));
    setRegionData(generateRegionData(days));
    setDurationData(generateDurationData());
    setYoyData(generateYoYComparison());
    setMomData(generateMoMComparison());
  }, [dateRange]);

  const totalSubsidy = trendData.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalOrders = trendData.reduce((sum, d) => sum + d.orderCount, 0);
  const avgSubsidy = totalOrders > 0 ? totalSubsidy / totalOrders : 0;
  const totalDistanceBonus = trendData.reduce((sum, d) => sum + d.distanceBonus, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">路线补贴趋势看板</h1>
          <p className="text-gray-500 mt-1">观察本地跑腿路线补贴变化趋势</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="补贴总金额"
          value={totalSubsidy}
          isCurrency
          change={momData?.momRate}
          changeLabel="环比"
          icon="💰"
        />
        <StatCard
          title="补贴订单数"
          value={totalOrders}
          change={yoyData?.yoyRate}
          changeLabel="同比"
          icon="📦"
        />
        <StatCard
          title="单均补贴"
          value={avgSubsidy}
          isCurrency
          change={2.5}
          changeLabel="环比"
          icon="📊"
        />
        <StatCard
          title="距离补贴总额"
          value={totalDistanceBonus}
          isCurrency
          change={-1.2}
          changeLabel="环比"
          icon="📍"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">补贴金额趋势</h2>
            <span className="text-sm text-gray-500">近{dateRange === "7d" ? "7" : dateRange === "30d" ? "30" : "90"}天</span>
          </div>
          <SubsidyTrendChart data={trendData} type="area" height={300} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">同环比分析</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">同比（去年同期）</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {yoyData?.yoyRate > 0 ? "+" : ""}{yoyData?.yoyRate?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                去年: {formatCurrency(yoyData?.lastYear?.totalAmount || 0)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">环比（上月）</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {momData?.momRate > 0 ? "+" : ""}{momData?.momRate?.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                上月: {formatCurrency(momData?.lastMonth?.totalAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">各区域补贴对比</h2>
          <RegionChart data={regionData} height={280} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">派单时长分布</h2>
          <DurationChart data={durationData} type="bar" height={280} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">补贴构成分析</h2>
        <SubsidyTrendChart data={trendData} type="bar" height={250} />
      </div>
    </div>
  );
}
