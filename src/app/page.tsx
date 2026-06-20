"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import HeatmapChart from "@/components/HeatmapChart";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Calendar,
  Filter,
  BarChart3,
} from "lucide-react";
import { subDays, format } from "date-fns";

interface RouteData {
  id: string;
  name: string;
  color: string;
  data: { date: string; visitorCount: number }[];
}

interface CancelEvent {
  id: string;
  date: string;
  performanceName: string;
  performanceId: string;
  reason: string;
  affectedCount: number;
}

interface HeatPoint {
  id: string;
  name: string;
  lng: number | null;
  lat: number | null;
  visitorCount: number;
  growthRate: number;
  hasChildren: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [compareType, setCompareType] = useState<"none" | "yoy" | "mom">("mom");
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [cancelEvents, setCancelEvents] = useState<CancelEvent[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatPoint[]>([]);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const mockRoutes: RouteData[] = [
    {
      id: "route-1",
      name: "经典游览线",
      color: "#06b6d4",
      data: generateMockData(7),
    },
    {
      id: "route-2",
      name: "深度体验线",
      color: "#f97316",
      data: generateMockData(7),
    },
    {
      id: "route-3",
      name: "亲子欢乐线",
      color: "#10b981",
      data: generateMockData(7),
    },
    {
      id: "route-4",
      name: "文化探秘线",
      color: "#8b5cf6",
      data: generateMockData(7),
    },
  ];

  const mockCancelEvents: CancelEvent[] = [
    {
      id: "cancel-1",
      date: format(subDays(new Date(), 2), "yyyy-MM-dd"),
      performanceName: "印象西湖",
      performanceId: "perf-1",
      reason: "天气原因",
      affectedCount: 1200,
    },
    {
      id: "cancel-2",
      date: format(subDays(new Date(), 5), "yyyy-MM-dd"),
      performanceName: "宋城千古情",
      performanceId: "perf-2",
      reason: "设备检修",
      affectedCount: 800,
    },
  ];

  const mockHeatmap: HeatPoint[] = [
    { id: "1", name: "主入口广场", lng: 120.1, lat: 30.2, visitorCount: 8520, growthRate: 12.5, hasChildren: false },
    { id: "2", name: "湖心岛", lng: 120.12, lat: 30.22, visitorCount: 6340, growthRate: 8.3, hasChildren: true },
    { id: "3", name: "古街区", lng: 120.08, lat: 30.18, visitorCount: 5890, growthRate: -3.2, hasChildren: true },
    { id: "4", name: "演艺中心", lng: 120.15, lat: 30.25, visitorCount: 4560, growthRate: 15.7, hasChildren: false },
    { id: "5", name: "美食街", lng: 120.11, lat: 30.19, visitorCount: 7230, growthRate: 5.8, hasChildren: false },
    { id: "6", name: "博物馆", lng: 120.09, lat: 30.23, visitorCount: 3450, growthRate: -1.2, hasChildren: false },
    { id: "7", name: "观景台", lng: 120.13, lat: 30.21, visitorCount: 5120, growthRate: 10.1, hasChildren: false },
    { id: "8", name: "儿童乐园", lng: 120.14, lat: 30.17, visitorCount: 4780, growthRate: 22.3, hasChildren: false },
  ];

  useEffect(() => {
    setRoutes(mockRoutes);
    setCancelEvents(mockCancelEvents);
    setHeatmapData(mockHeatmap);
  }, []);

  const handleCancelClick = (performanceId: string) => {
    router.push(`/performances/${performanceId}`);
  };

  const totalVisitors = routes.reduce(
    (sum, route) =>
      sum + route.data.reduce((s, d) => s + d.visitorCount, 0),
    0
  );
  const avgDaily = Math.round(totalVisitors / 7);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              导览路线趋势看板
            </h2>
            <p className="text-sm text-slate-400">
              实时监控各导览路线客流变化，洞察运营趋势
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 glass-card">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-sm text-slate-300">
                {format(dateRange.start, "MM/dd")} -{" "}
                {format(dateRange.end, "MM/dd")}
              </span>
            </div>

            <div className="flex glass-card rounded-lg overflow-hidden">
              {[
                { key: "none", label: "无对比" },
                { key: "yoy", label: "同比" },
                { key: "mom", label: "环比" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCompareType(item.key as any)}
                  className={`px-3 py-2 text-sm transition-colors ${
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

        <div className="grid grid-cols-6 gap-4">
          <StatCard
            title="总客流数"
            value={totalVisitors.toLocaleString()}
            change={12.5}
            icon={<Users size={22} />}
            color="primary"
            delay={0}
          />
          <StatCard
            title="日均客流"
            value={avgDaily.toLocaleString()}
            change={8.3}
            icon={<BarChart3 size={22} />}
            color="emerald"
            delay={0.1}
          />
          <StatCard
            title="二消总额"
            value="¥128.5万"
            change={15.7}
            icon={<ShoppingBag size={22} />}
            color="accent"
            delay={0.2}
          />
          <StatCard
            title="二消转化率"
            value="23.8%"
            change={-2.1}
            icon={<TrendingUp size={22} />}
            color="violet"
            delay={0.3}
          />
          <StatCard
            title="活跃路线"
            value="6 条"
            change={1}
            icon={<MapPin size={22} />}
            color="primary"
            delay={0.4}
          />
          <StatCard
            title="演出场次"
            value="12 场"
            change={-2}
            icon={<Filter size={22} />}
            color="accent"
            delay={0.5}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">
                <TrendingUp size={18} className="text-primary-400" />
                导览路线客流趋势
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  点击取消标记查看演出详情
                </span>
              </div>
            </div>
            <div className="h-[320px]">
              <TrendChart
                routes={routes}
                cancelEvents={cancelEvents}
                onCancelClick={handleCancelClick}
              />
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">
                <MapPin size={18} className="text-accent-400" />
                热力点位分布
              </h3>
            </div>
            <div className="h-[320px]">
              <HeatmapChart data={heatmapData} compareType={compareType} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">
              <TrendingUp size={18} className="text-emerald-400" />
              热门路线 TOP5
            </h3>
            <div className="space-y-3">
              {routes.slice(0, 5).map((route, index) => {
                const total = route.data.reduce(
                  (sum, d) => sum + d.visitorCount,
                  0
                );
                const maxTotal = Math.max(
                  ...routes.map((r) =>
                    r.data.reduce((s, d) => s + d.visitorCount, 0)
                  )
                );
                const percent = (total / maxTotal) * 100;

                return (
                  <div key={route.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            index < 3
                              ? "bg-gradient-to-br from-accent-500 to-amber-600 text-white"
                              : "bg-dark-700 text-slate-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                          {route.name}
                        </span>
                      </div>
                      <span className="font-mono text-sm text-white">
                        {total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: route.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-title mb-4">
              <MapPin size={18} className="text-violet-400" />
              区域客流对比
            </h3>
            <div className="space-y-3">
              {[
                { name: "东区", count: 28560, percent: 85 },
                { name: "西区", count: 23420, percent: 70 },
                { name: "南区", count: 18930, percent: 56 },
                { name: "北区", count: 15680, percent: 47 },
                { name: "中心区", count: 33240, percent: 100 },
              ].map((area, index) => (
                <div key={area.name} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {area.name}
                    </span>
                    <span className="font-mono text-sm text-white">
                      {area.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary-500 transition-all duration-500"
                      style={{ width: `${area.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function generateMockData(days: number) {
  const data = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, "MM-dd"),
      visitorCount: Math.floor(2000 + Math.random() * 4000),
    });
  }
  return data;
}
