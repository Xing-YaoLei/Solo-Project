"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import DateRangePicker from "@/components/DateRangePicker";
import SubsidyTrendChart from "@/components/charts/SubsidyTrendChart";
import RegionChart from "@/components/charts/RegionChart";
import DurationChart from "@/components/charts/DurationChart";
import { generateOrderReport, generateRegionData, generateDurationData } from "@/lib/mockData";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default function ReportPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [reportData, setReportData] = useState<any>(null);
  const [regionData, setRegionData] = useState<any[]>([]);
  const [durationData, setDurationData] = useState<any[]>([]);

  useEffect(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 30;
    setReportData(generateOrderReport(days));
    setRegionData(generateRegionData(days));
    setDurationData(generateDurationData());
  }, [dateRange]);

  if (!reportData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">综合报表</h1>
          <p className="text-gray-500 mt-1">按派单时长、日期和区域进行多维度比较</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总订单数"
          value={reportData.summary.totalOrders}
          icon="📦"
        />
        <StatCard
          title="完成订单"
          value={reportData.summary.totalDelivered}
          icon="✅"
        />
        <StatCard
          title="损坏订单"
          value={reportData.summary.totalDamaged}
          icon="💔"
        />
        <StatCard
          title="补贴总金额"
          value={reportData.summary.totalSubsidy}
          isCurrency
          icon="💰"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">平均客单价</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {formatCurrency(reportData.summary.avgOrderValue)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">平均派单时长</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {formatDuration(Math.round(reportData.summary.avgDispatchDuration))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">损坏率</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">
            {reportData.summary.damageRate}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">日期维度分析</h2>
        <SubsidyTrendChart data={reportData.dailyStats} type="line" height={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">区域维度比较</h2>
          <RegionChart data={regionData} height={280} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">派单时长维度</h2>
          <DurationChart data={durationData} type="pie" height={280} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">每日明细数据</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-500">日期</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">订单数</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">完成数</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">损坏数</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">补贴金额</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">平均派单时长</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500">损坏率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.dailyStats.slice(0, 10).map((day: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{day.date}</td>
                  <td className="px-6 py-4 text-right text-gray-900">{day.orderCount}</td>
                  <td className="px-6 py-4 text-right text-green-600">{day.deliveredCount}</td>
                  <td className="px-6 py-4 text-right text-red-600">{day.damagedCount}</td>
                  <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(day.totalAmount)}</td>
                  <td className="px-6 py-4 text-right text-gray-900">{day.avgDispatchDuration}分钟</td>
                  <td className="px-6 py-4 text-right text-gray-900">{day.damageRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
