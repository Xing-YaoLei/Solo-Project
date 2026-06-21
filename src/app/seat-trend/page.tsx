'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { SeatTrendChart } from '@/components/charts/SeatTrendChart';
import { AreaHeatmap } from '@/components/charts/AreaHeatmap';
import { MapPin, Calendar, Info } from 'lucide-react';
import { formatPercent, formatNumber } from '@/lib/utils';

export default function SeatTrendPage() {
  const { seatTrend, areaHeatmap, isLoading, fetchSeatTrend } = useDashboardStore();

  useEffect(() => {
    fetchSeatTrend();
  }, [fetchSeatTrend]);

  if (isLoading && seatTrend.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-neutral-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  const totalSold = areaHeatmap.reduce((sum, area) => sum + (area.soldSeats ?? 0), 0);
  const totalSeats = areaHeatmap.reduce((sum, area) => sum + area.totalSeats, 0);
  const overallRate = totalSeats > 0 ? totalSold / totalSeats : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">座位图趋势分析</h1>
          <p className="mt-1 text-neutral-400">按时间和区域维度分析座位销售情况</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-neutral-800/50 px-3 py-2">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-sm text-neutral-300">最近30天</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-success/20 px-3 py-2">
            <MapPin className="h-4 w-4 text-success" />
            <span className="text-sm text-success">
              整体上座率：{formatPercent(overallRate)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-fade-in-stagger">
        {areaHeatmap.map((area, index) => (
          <div
            key={area.area}
            className="card p-4 card-hover"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">{area.area}</h3>
              <span
                className={`text-sm font-medium ${
                  (area.occupancyRate ?? 0) >= 0.85 ? 'text-success' :
                  (area.occupancyRate ?? 0) >= 0.6 ? 'text-primary' :
                  (area.occupancyRate ?? 0) >= 0.4 ? 'text-warning' : 'text-danger'
                }`}
              >
                {formatPercent(area.occupancyRate ?? 0)}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-white">
                {formatNumber(area.soldSeats ?? 0)}
              </span>
              <span className="text-neutral-500">/ {formatNumber(area.totalSeats)}</span>
            </div>
            <div className="mt-3 progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${(area.occupancyRate ?? 0) * 100}%`,
                  backgroundColor:
                    (area.occupancyRate ?? 0) >= 0.85 ? '#10B981' :
                    (area.occupancyRate ?? 0) >= 0.6 ? '#3B82F6' :
                      (area.occupancyRate ?? 0) >= 0.4 ? '#F59E0B' : '#EF4444',
                }}
              />
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              剩余 {formatNumber(area.totalSeats - (area.soldSeats ?? 0))} 座可售
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">座位销售时间趋势</h2>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Info className="h-3.5 w-3.5" />
            点击图例可切换显示/隐藏
          </div>
        </div>
        {seatTrend.length > 0 && <SeatTrendChart data={seatTrend} />}
      </div>

      <div className="card p-5 animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <h2 className="mb-4 font-display text-lg font-semibold text-white">区域热力图</h2>
        <AreaHeatmap data={areaHeatmap} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="card p-5">
          <h3 className="mb-4 font-display font-semibold text-white">区域销售对比</h3>
          <div className="space-y-4">
            {areaHeatmap.map((area) => (
              <div key={area.area} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300">{area.area}</span>
                  <span className="font-mono text-white">
                    {formatPercent(area.occupancyRate ?? 0)}
                  </span>
                </div>
                <div className="h-8 overflow-hidden rounded-lg bg-neutral-800/50">
                  <div
                    className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${(area.occupancyRate ?? 0) * 100}%`,
                      background: `linear-gradient(90deg, 
                        ${(area.occupancyRate ?? 0) >= 0.85 ? '#059669' :
                          (area.occupancyRate ?? 0) >= 0.6 ? '#2563EB' :
                          (area.occupancyRate ?? 0) >= 0.4 ? '#D97706' : '#DC2626'}, 
                        ${(area.occupancyRate ?? 0) >= 0.85 ? '#10B981' :
                          (area.occupancyRate ?? 0) >= 0.6 ? '#3B82F6' :
                          (area.occupancyRate ?? 0) >= 0.4 ? '#F59E0B' : '#EF4444'}
                      )`,
                    }}
                  >
                    {(area.occupancyRate ?? 0) > 0.15 && (
                      <span className="text-xs font-medium text-white/90">
                        {formatNumber(area.soldSeats ?? 0)}/{formatNumber(area.totalSeats)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 font-display font-semibold text-white">分析说明</h3>
          <div className="space-y-3 text-sm text-neutral-300">
            <div className="flex gap-3">
              <div className="mt-1 h-6 w-1 rounded-full bg-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-white">VIP区销售最佳</p>
                <p className="text-neutral-500">上座率超过85%，高价值区域需求旺盛</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-6 w-1 rounded-full bg-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-white">C区需加强推广</p>
                <p className="text-neutral-500">上座率低于50%，可考虑推出优惠活动</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1 h-6 w-1 rounded-full bg-success flex-shrink-0" />
              <div>
                <p className="font-medium text-white">整体趋势向好</p>
                <p className="text-neutral-500">近7天日均销售增长12%，活动前有望突破90%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
