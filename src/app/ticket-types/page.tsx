'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { TicketTypesTable } from '@/components/tables/TicketTypesTable';
import { Ticket, Clock, AlertTriangle, TrendingUp, DollarSign, Tag } from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

export default function TicketTypesPage() {
  const { ticketTypes, isLoading, fetchTicketTypes } = useDashboardStore();

  useEffect(() => {
    fetchTicketTypes();
  }, [fetchTicketTypes]);

  if (isLoading && ticketTypes.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-neutral-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  const totalStock = ticketTypes.reduce((sum, t) => sum + t.totalStock, 0);
  const totalSold = ticketTypes.reduce((sum, t) => sum + t.soldCount, 0);
  const totalLocked = ticketTypes.reduce((sum, t) => sum + t.lockedCount, 0);
  const totalRevenue = ticketTypes.reduce((sum, t) => sum + t.soldCount * t.price, 0);
  const overallRate = totalStock > 0 ? totalSold / totalStock : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">票种规则明细</h1>
          <p className="mt-1 text-neutral-400">各票种定价、销售进度和限制规则一览</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 animate-fade-in-stagger">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">总库存</p>
              <p className="font-mono text-xl font-bold text-white">
                {formatNumber(totalStock)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">已售出</p>
              <p className="font-mono text-xl font-bold text-success">
                {formatNumber(totalSold)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">锁座中</p>
              <p className="font-mono text-xl font-bold text-warning">
                {formatNumber(totalLocked)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">预计收入</p>
              <p className="font-mono text-xl font-bold text-purple-400">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">综合上座率</p>
              <p className={`font-mono text-xl font-bold ${
                overallRate >= 0.8 ? 'text-success' :
                overallRate >= 0.6 ? 'text-primary' :
                overallRate >= 0.4 ? 'text-warning' : 'text-danger'
              }`}>
                {formatPercent(overallRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        {ticketTypes.map((ticket, index) => (
          <div
            key={ticket.id}
            className="card p-5 card-hover relative overflow-hidden"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className="absolute top-0 right-0 h-24 w-24 opacity-10"
              style={{
                background: `radial-gradient(circle at top right, ${
                  ticket.price >= 1000 ? '#10B981' :
                  ticket.price >= 600 ? '#3B82F6' :
                  ticket.price >= 400 ? '#F59E0B' : '#64748B'
                }, transparent 70%)`,
              }}
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">{ticket.name}</h3>
                  <p className="mt-1 text-xs text-neutral-500">{ticket.description}</p>
                </div>
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: ticket.price >= 1000 ? 'rgba(16, 185, 129, 0.2)' :
                      ticket.price >= 600 ? 'rgba(59, 130, 246, 0.2)' :
                      ticket.price >= 400 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                  }}
                >
                  <Tag className="h-5 w-5" style={{
                    color: ticket.price >= 1000 ? '#10B981' :
                      ticket.price >= 600 ? '#3B82F6' :
                      ticket.price >= 400 ? '#F59E0B' : '#64748B',
                  }} />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-white">
                  {formatCurrency(ticket.price)}
                </span>
                {ticket.discount > 0 && (
                  <>
                    <span className="text-sm text-neutral-500 line-through">
                      {formatCurrency(ticket.originalPrice)}
                    </span>
                    <span className="badge-danger text-xs">
                      {formatPercent(ticket.discount)} OFF
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-neutral-400">销售进度</span>
                    <span className="font-mono text-white">
                      {formatPercent(ticket.occupancyRate)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${ticket.occupancyRate * 100}%`,
                        backgroundColor: ticket.occupancyRate >= 0.8 ? '#10B981' :
                          ticket.occupancyRate >= 0.6 ? '#3B82F6' :
                          ticket.occupancyRate >= 0.4 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-neutral-500">
                    <span>已售 {formatNumber(ticket.soldCount)}</span>
                    <span>锁座 {formatNumber(ticket.lockedCount)}</span>
                    <span>剩余 {formatNumber(ticket.remainingCount)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-700/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>限购 {ticket.maxPerOrder} 张/人</span>
                  </div>
                  {ticket.restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ticket.restrictions.map((r, i) => (
                        <span key={i} className="badge-neutral text-xs">{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">详细数据</h2>
          <p className="text-sm text-neutral-500">点击表头可排序</p>
        </div>
        <TicketTypesTable data={ticketTypes} />
      </div>

      <div className="card p-5 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <h3 className="mb-4 font-display font-semibold text-white">销售建议</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ticketTypes.filter(t => t.occupancyRate < 0.6).length > 0 && (
            <div className="rounded-lg bg-warning/10 border border-warning/30 p-4">
              <p className="text-sm font-medium text-warning mb-2">需重点关注</p>
              <div className="space-y-2">
                {ticketTypes.filter(t => t.occupancyRate < 0.6).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300">{t.name}</span>
                    <span className="text-warning">{formatPercent(t.occupancyRate)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                建议：针对上座率较低的票种，可推出组合优惠或捆绑销售策略。
              </p>
            </div>
          )}

          <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
            <p className="text-sm font-medium text-primary mb-2">定价策略分析</p>
            <p className="text-sm text-neutral-300">
              中档价位（500-900元区间）的票种销售表现最佳，贡献了主要销量。
              VIP区虽然价格较高，但上座率领先，说明高价值用户需求旺盛。
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              建议：未来活动可考虑适当增加VIP区座位比例，优化价格梯度。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
