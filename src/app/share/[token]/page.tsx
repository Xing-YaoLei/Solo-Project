'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useDashboardStore } from '@/store/useDashboardStore';
import { StatCard } from '@/components/StatCard';
import { SeatTrendChart } from '@/components/charts/SeatTrendChart';
import { CompositionPieChart } from '@/components/charts/CompositionPieChart';
import { Users, Ticket, TrendingUp, Lock, AlertTriangle, Clock, Info, ArrowLeft } from 'lucide-react';
import { formatPercent, formatDate } from '@/lib/utils';
import { UserRoleLabels } from '@/types';
import Link from 'next/link';

interface SharePageProps {
  params: { token: string };
}

export default function SharePage({ params }: SharePageProps) {
  const { token } = params;
  const [isValid, setIsValid] = useState(true);
  const [shareInfo, setShareInfo] = useState<{ role: string; expiresAt: Date } | null>(null);
  
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
    if (!token || token.length !== 32) {
      setIsValid(false);
      return;
    }

    setShareInfo({
      role: 'operator',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    fetchOverview();
    fetchSeatTrend();
    fetchOrderComposition();
  }, [token, fetchOverview, fetchSeatTrend, fetchOrderComposition]);

  if (!isValid) {
    notFound();
  }

  if (isLoading && !overview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-neutral-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="btn-ghost gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回看板
            </Link>
            <div className="h-6 w-px bg-neutral-700" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">票务看板</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {shareInfo && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-neutral-800/50 px-3 py-1.5">
                <span className="text-xs text-neutral-400">
                  权限：{UserRoleLabels[shareInfo.role as keyof typeof UserRoleLabels]}
                </span>
              </div>
            )}
            {overview?.lastRefreshedAt && (
              <div className="flex items-center gap-2 rounded-lg bg-neutral-800/50 px-3 py-1.5">
                <Clock className="h-4 w-4 text-success" />
                <span className="text-xs text-neutral-300">
                  最近刷新：
                  <span className="font-mono text-success" title={formatDate(overview.lastRefreshedAt)}>
                    {formatDate(overview.lastRefreshedAt)}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
          {shareInfo && new Date() > shareInfo.expiresAt && (
            <div className="card border-danger/30 bg-danger/5 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-danger" />
                <div>
                  <p className="font-medium text-danger">链接已过期</p>
                  <p className="text-sm text-neutral-400">
                    该分享链接已于 {formatDate(shareInfo.expiresAt)} 过期，请联系分享者获取新链接。
                  </p>
                </div>
              </div>
            </div>
          )}

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
              delay={0.2}
            />
            <StatCard
              title="上座率"
              value={overview?.occupancyRate || 0}
              isPercentage
              icon={<TrendingUp className="h-6 w-6 text-accent" />}
              gradientFrom="#F59E0B"
              gradientTo="#FBBF24"
              delay={0.3}
            />
            <StatCard
              title="锁座数量"
              value={overview?.lockedSeats || 0}
              icon={<Lock className="h-6 w-6 text-warning" />}
              gradientFrom="#8B5CF6"
              gradientTo="#A78BFA"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

          <footer className="pt-6 pb-4 text-center text-xs text-neutral-600 animate-fade-in" style={{ animationDelay: '0.9s' }}>
            <p>本页面为分享视图，数据仅供参考 · 数据来源：报名表、支付流水、票务平台</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
