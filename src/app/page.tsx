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
  Loader2,
  Camera,
  FileText,
  Theater,
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
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalVisitors: 0,
    avgDaily: 0,
    growthRate: 0,
    secondaryConsumptionTotal: 0,
    secondaryConversionRate: 0,
    secondaryConsumptionGrowth: 0,
    secondaryConversionGrowth: 0,
    activeRoutes: 0,
    performanceCount: 0,
    performanceGrowth: 0,
    cameraVisitorCount: 0,
    avgSeatOccupancy: 0,
    avgSeatOccupancyGrowth: 0,
    contractCount: 0,
    caliberNotes: [] as string[],
  });
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 13),
    end: new Date(),
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const startStr = format(dateRange.start, "yyyy-MM-dd");
        const endStr = format(dateRange.end, "yyyy-MM-dd");
        const heatmapDate = format(new Date(), "yyyy-MM-dd");

        const [trendRes, heatRes] = await Promise.all([
          fetch(`/api/dashboard/trend?startDate=${startStr}&endDate=${endStr}&compareType=${compareType === "none" ? "none" : compareType}`),
          fetch(`/api/dashboard/heatmap?date=${heatmapDate}&compareType=${compareType === "none" ? "" : compareType}`),
        ]);

        if (trendRes.ok) {
          const trendData = await trendRes.json();
          setRoutes(trendData.routes || []);
          setCancelEvents(trendData.cancelEvents || []);
          setSummary(trendData.summary || {
            totalVisitors: 0, avgDaily: 0, growthRate: 0,
            secondaryConsumptionTotal: 0, secondaryConversionRate: 0,
            secondaryConsumptionGrowth: 0, secondaryConversionGrowth: 0,
            activeRoutes: 0, performanceCount: 0, performanceGrowth: 0,
            cameraVisitorCount: 0, avgSeatOccupancy: 0, avgSeatOccupancyGrowth: 0,
            contractCount: 0, caliberNotes: [],
          });
        }

        if (heatRes.ok) {
          const heatResData = await heatRes.json();
          const heatData = Array.isArray(heatResData) ? heatResData : (heatResData?.data || []);
          setHeatmapData(heatData);
        }
      } catch (e) {
        console.error("Fetch dashboard error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [compareType, dateRange]);

  const handleCancelClick = (performanceId: string) => {
    router.push(`/performances/${performanceId}`);
  };

  const totalVisitors = summary.totalVisitors || routes.reduce(
    (sum, route) =>
      sum + route.data.reduce((s, d) => s + d.visitorCount, 0),
    0
  );
  const dayCount = routes[0]?.data?.length || 14;
  const avgDaily = summary.avgDaily || Math.round(totalVisitors / dayCount);

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

        <div className="grid grid-cols-9 gap-4">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-card p-4 flex items-center justify-center h-24">
                <Loader2 size={20} className="animate-spin text-slate-500" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="总客流数"
                value={totalVisitors.toLocaleString()}
                change={summary.growthRate}
                icon={<Users size={22} />}
                color="primary"
                delay={0}
              />
              <StatCard
                title="日均客流"
                value={avgDaily.toLocaleString()}
                change={summary.growthRate}
                icon={<BarChart3 size={22} />}
                color="emerald"
                delay={0.1}
              />
              <StatCard
                title="二消总额"
                value={`¥${(summary.secondaryConsumptionTotal / 10000).toFixed(1)}万`}
                change={summary.secondaryConsumptionGrowth}
                icon={<ShoppingBag size={22} />}
                color="accent"
                delay={0.2}
              />
              <StatCard
                title="二消转化率"
                value={`${summary.secondaryConversionRate.toFixed(1)}%`}
                change={summary.secondaryConversionGrowth}
                icon={<TrendingUp size={22} />}
                color="violet"
                delay={0.3}
              />
              <StatCard
                title="活跃路线"
                value={`${summary.activeRoutes} 条`}
                change={0}
                icon={<MapPin size={22} />}
                color="primary"
                delay={0.4}
              />
              <StatCard
                title="演出场次"
                value={`${summary.performanceCount} 场`}
                change={summary.performanceGrowth}
                icon={<Filter size={22} />}
                color="accent"
                delay={0.5}
              />
              <StatCard
                title="摄像头客流"
                value={summary.cameraVisitorCount.toLocaleString()}
                change={0}
                icon={<Camera size={22} />}
                color="emerald"
                delay={0.6}
              />
              <StatCard
                title="平均上座率"
                value={`${summary.avgSeatOccupancy.toFixed(1)}%`}
                change={summary.avgSeatOccupancyGrowth}
                icon={<Theater size={22} />}
                color="violet"
                delay={0.7}
              />
              <StatCard
                title="有效合同"
                value={`${summary.contractCount} 份`}
                change={0}
                icon={<FileText size={22} />}
                color="accent"
                delay={0.8}
              />
            </>
          )}
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
              {(() => {
                const sortedAreas = [...heatmapData].sort((a, b) => b.visitorCount - a.visitorCount);
                const maxCount = Math.max(...sortedAreas.map(a => a.visitorCount), 1);
                return sortedAreas.slice(0, 5).map((area) => (
                  <div key={area.id} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                        {area.name}
                      </span>
                      <span className="font-mono text-sm text-white">
                        {area.visitorCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary-500 transition-all duration-500"
                        style={{ width: `${(area.visitorCount / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {!loading && summary.caliberNotes.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="section-title mb-4">
              <FileText size={18} className="text-primary-400" />
              数据统计口径说明（来自合同约定）
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {summary.caliberNotes.map((note, i) => (
                <div key={i} className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                  <p className="text-sm text-slate-300">{note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
