'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { CompositionPieChart } from '@/components/charts/CompositionPieChart';
import { DailySalesBarChart } from '@/components/charts/DailySalesBarChart';
import { CreditCard, Users, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import { CHART_COLORS } from '@/types';

export default function OrderCompositionPage() {
  const { orderComposition, isLoading, fetchOrderComposition } = useDashboardStore();

  useEffect(() => {
    fetchOrderComposition();
  }, [fetchOrderComposition]);

  if (isLoading && !orderComposition) {
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">购票订单构成分析</h1>
          <p className="mt-1 text-neutral-400">多维度拆解订单构成，洞察用户购票行为</p>
        </div>
      </div>

      {orderComposition && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-stagger">
            <div className="card p-5 gradient-card" style={{ '--tw-gradient-from': '#3B82F6', '--tw-gradient-to': '#60A5FA' } as React.CSSProperties}>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">总订单数</p>
                    <p className="font-mono text-2xl font-bold text-white">
                      {formatNumber(orderComposition.totalOrders)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5 gradient-card" style={{ '--tw-gradient-from': '#10B981', '--tw-gradient-to': '#34D399' } as React.CSSProperties}>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-success/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">总销售金额</p>
                    <p className="font-mono text-2xl font-bold text-white">
                      {formatCurrency(orderComposition.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5 gradient-card" style={{ '--tw-gradient-from': '#F59E0B', '--tw-gradient-to': '#FBBF24' } as React.CSSProperties}>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-warning/20 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">客单价</p>
                    <p className="font-mono text-2xl font-bold text-white">
                      {formatCurrency(orderComposition.totalAmount / orderComposition.totalOrders)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-5 gradient-card" style={{ '--tw-gradient-from': '#8B5CF6', '--tw-gradient-to': '#A78BFA' } as React.CSSProperties}>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">支付成功率</p>
                    <p className="font-mono text-2xl font-bold text-white">92.5%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
          </div>

          <DailySalesBarChart data={orderComposition.byDate} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-white">
                <Users className="h-5 w-5 text-primary" />
                订单来源分析
              </h3>
              <div className="space-y-4">
                {orderComposition.bySource.map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: Object.values(CHART_COLORS)[index % 8] }}
                        />
                        <span className="text-neutral-300">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-medium text-white">
                          {formatNumber(item.value)}
                        </span>
                        <span className="ml-2 text-sm text-neutral-500">
                          ({formatPercent(item.value / orderComposition.totalOrders)})
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(item.value / orderComposition.totalOrders) * 100}%`,
                          backgroundColor: Object.values(CHART_COLORS)[index % 8],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-white">
                <CreditCard className="h-5 w-5 text-success" />
                支付方式分析
              </h3>
              <div className="space-y-4">
                {orderComposition.byPaymentMethod.map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: Object.values(CHART_COLORS)[(index + 4) % 8] }}
                        />
                        <span className="text-neutral-300">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-medium text-white">
                          {formatNumber(item.value)}
                        </span>
                        <span className="ml-2 text-sm text-neutral-500">
                          ({formatPercent(item.value / orderComposition.totalOrders)})
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(item.value / orderComposition.totalOrders) * 100}%`,
                          backgroundColor: Object.values(CHART_COLORS)[(index + 4) % 8],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <h3 className="mb-4 font-display font-semibold text-white">洞察结论</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                <p className="text-sm font-medium text-primary mb-2">渠道洞察</p>
                <p className="text-sm text-neutral-300">
                  线上渠道贡献了超过57%的订单量，建议加大线上营销投入，优化移动端购票体验。
                </p>
              </div>
              <div className="rounded-lg bg-success/10 border border-success/30 p-4">
                <p className="text-sm font-medium text-success mb-2">支付洞察</p>
                <p className="text-sm text-neutral-300">
                  支付宝和微信支付占比超过82%，成为主要支付方式，可考虑增加数字人民币支持。
                </p>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
                <p className="text-sm font-medium text-warning mb-2">票价洞察</p>
                <p className="text-sm text-neutral-300">
                  A区和B区贡献了超过74%的销量，中端票价最受消费者青睐。
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
