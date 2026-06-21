'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { StatCard } from '@/components/StatCard';
import { SeatTrendChart } from '@/components/charts/SeatTrendChart';
import { CompositionPieChart } from '@/components/charts/CompositionPieChart';
import { Users, Ticket, TrendingUp, Lock, AlertTriangle, DollarSign, Info } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { CHART_COLORS } from '@/types';

export default function HomePage() {
  const {
    overview,
    seatTrend,
    orderComposition,
    isLoading,
    fetchOverview,
    fetchSeatTrend,
    fetchOrderComposition,
  } = useDashboardStore();

  useEffect(() => {
    fetchOverview();
    fetchSeatTrend();
    fetchOrderComposition();
  }, [fetchOverview, fetchSeatTrend, fetchOrderComposition]);

  if (isLoading && !overview) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-neutral-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 animate-fade-in-stagger">
        <StatCard
          title="总座位数"
          value={overview?.totalSeats || 0}
          icon={<Users className="h-6 w-6 text-primary" />}
          gradientFrom="#3B82F6"
          gradientTo="#60A5FA"
          delay={0.1}
        />
        <StatCard
          title="已售座位"
          value={overview?.soldSeats || 0}
          icon={<Ticket className="h-6 w-6 text-success" />}
          gradientFrom="#10B981"
          gradientTo="#34D399"
          trend={0.125}
          delay={0.2}
        />
        <StatCard
          title="上座率"
          value={overview?.occupancyRate || 0}
          isPercentage
          icon={<TrendingUp className="h-6 w-6 text-accent" />}
          gradientFrom="#F59E0B"
          gradientTo="#FBBF24"
          trend={0.083}
          delay={0.3}
        />
        <StatCard
          title="锁座数量"
          value={overview?.lockedSeats || 0}
          icon={<Lock className="h-6 w-6 text-warning" />}
          gradientFrom="#8B5CF6"
          gradientTo="#A78BFA"
          trend={-0.05}
          delay={0.4}
        />
        <StatCard
          title="异常记录"
          value={overview?.anomalyCount || 0}
          icon={<AlertTriangle className="h-6 w-6 text-danger" />}
          gradientFrom="#EF4444"
          gradientTo="#F87171"
          delay={0.5}
        />
      </div>

      {overview?.occupancyRateSpec && (
        <div className="card p-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-white mb-2">上座率计算口径</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">计算方法：</span>
                  <span className="text-neutral-300 ml-1">{overview.occupancyRateSpec.calculationMethod}</span>
                </div>
                <div>
                  <span className="text-neutral-500">计算公式：</span>
                  <code className="font-mono text-primary ml-1 bg-primary/10 px-1.5 py-0.5 rounded">
                    {overview.occupancyRateSpec.formula}
                  </code>
                </div>
                <div>
                  <span className="text-neutral-500">排除座位：</span>
                  <span className="text-neutral-300 ml-1">{overview.occupancyRateSpec.excludedSeats.join('、')}</span>
                </div>
                <div>
                  <span className="text-neutral-500">数据来源：</span>
                  <span className="text-neutral-300 ml-1">{overview.occupancyRateSpec.dataSources.join('、')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card p-5 animate-fade-in" style={{ animationDelay: '0.7s' }}>
        <h2 className="mb-4 font-display text-lg font-semibold text-white">座位销售趋势</h2>
        {seatTrend.length > 0 && <SeatTrendChart data={seatTrend} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.8s' }}>
        {orderComposition && (
          <>
            <CompositionPieChart
              data={orderComposition.bySource}
              title="订单来源分布"
              totalLabel="订单总数"
            />
            <CompositionPieChart
              data={orderComposition.byPaymentMethod}
              title="支付方式构成"
              totalLabel="订单总数"
            />
            <CompositionPieChart
              data={orderComposition.byTicketType}
              title="票种销量占比"
              totalLabel="订单总数"
            />
          </>
        )}
      </div>

      {orderComposition && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <div className="card p-5">
            <h3 className="mb-3 font-display font-semibold text-white">销售汇总</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">总订单数</span>
                <span className="font-mono text-xl font-bold text-white">
                  {orderComposition.totalOrders.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">总销售金额</span>
                <span className="font-mono text-xl font-bold text-success">
                  {formatCurrency(orderComposition.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">客单价</span>
                <span className="font-mono text-xl font-bold text-primary">
                  {formatCurrency(orderComposition.totalAmount / orderComposition.totalOrders)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 font-display font-semibold text-white">快速指标</h3>
            <div className="grid grid-cols-2 gap-4">
              {orderComposition.bySource.slice(0, 4).map((item, i) => (
                <div key={item.name} className="rounded-lg bg-neutral-800/50 p-3">
                  <div className="text-xs text-neutral-500">{item.label}</div>
                  <div className="mt-1 font-mono text-lg font-bold text-white">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    占比 {formatPercent(item.value / orderComposition.totalOrders)}
                  </div>
                  <div className="progress-bar mt-2">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${(item.value / orderComposition.totalOrders) * 100}%`,
                        backgroundColor: Object.values(CHART_COLORS)[i % 8],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
