'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Target,
  FileSearch,
  User,
  Link2,
  ChevronRight,
  CircleDot,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/store/session';
import { mockData } from '@/lib/mock-data';
import { KpiCard } from '@/components/ui/KpiCard';
import { RiskBadge, StatusBadge, SourceBadge } from '@/components/ui/Badges';
import { formatPercent, formatDateTime, cn, formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RCTooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user } = useSession();
  const router = useRouter();
  const [kpi, setKpi] = useState<ReturnType<typeof mockData.kpi.overview> | null>(null);

  useEffect(() => {
    if (!user) return;
    setKpi(mockData.kpi.overview(user.id, user.role));
  }, [user]);

  const totalRisk = useMemo(() => {
    if (!kpi) return { HIGH: 0, MEDIUM: 0, LOW: 0 };
    return kpi.riskCounts;
  }, [kpi]);

  const totalRiskSum = totalRisk.HIGH + totalRisk.MEDIUM + totalRisk.LOW;

  if (!kpi || !user) {
    return (
      <div className="h-96 flex items-center justify-center text-slate-400 text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          label="在途整改"
          value={formatNumber(kpi.inProgress)}
          trend={-2.4}
          accent="brand"
          progress={kpi.total ? kpi.inProgress / kpi.total : 0}
          sub={`占总数 ${kpi.total} 项`}
        />
        <KpiCard
          label="逾期风险"
          value={formatNumber(kpi.overdue)}
          trend={kpi.overdue ? +12.8 : 0}
          accent="danger"
          progress={kpi.total ? kpi.overdue / kpi.total : 0}
          sub="超出处理时限 · 需要立即关注"
        />
        <KpiCard
          label="首次解决率"
          value={formatPercent(kpi.firstPassRate)}
          trend={+3.6}
          accent="success"
          progress={kpi.firstPassRate}
          sub="复核一次通过 · 高质量整改"
        />
        <KpiCard
          label="整改关闭率"
          value={formatPercent(kpi.closedRate)}
          trend={+5.1}
          accent="warning"
          progress={kpi.closedRate}
          sub={`已关闭 ${Math.round(kpi.closedRate * kpi.total)} / ${kpi.total}`}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-5 animate-slide-up">
          <header className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-600" />
                风险态势分布
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                按风险等级统计当前整改项分布与占比
              </p>
            </div>
            <div className="flex gap-2">
              <div className="chip bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-600/20">
                实时
              </div>
            </div>
          </header>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
                {totalRiskSum ? (
                  <>
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600"
                      style={{ width: `${(totalRisk.HIGH / totalRiskSum) * 100}%` }}
                      title={`高风险 ${totalRisk.HIGH}`}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                      style={{ width: `${(totalRisk.MEDIUM / totalRiskSum) * 100}%` }}
                      title={`中风险 ${totalRisk.MEDIUM}`}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      style={{ width: `${(totalRisk.LOW / totalRiskSum) * 100}%` }}
                      title={`低风险 ${totalRisk.LOW}`}
                    />
                  </>
                ) : null}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[
                  { key: 'HIGH', label: '高风险', color: 'text-red-600', value: totalRisk.HIGH },
                  { key: 'MEDIUM', label: '中风险', color: 'text-amber-600', value: totalRisk.MEDIUM },
                  { key: 'LOW', label: '低风险', color: 'text-emerald-600', value: totalRisk.LOW },
                ].map((r) => (
                  <div
                    key={r.key}
                    className="rounded-xl border border-slate-200/70 p-3.5 bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{r.label}</span>
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          r.key === 'HIGH'
                            ? 'bg-red-500'
                            : r.key === 'MEDIUM'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500',
                        )}
                      />
                    </div>
                    <div className={cn('mt-1.5 text-2xl font-semibold font-mono', r.color)}>
                      {formatNumber(r.value)}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      {totalRiskSum
                        ? `${((r.value / totalRiskSum) * 100).toFixed(1)}%`
                        : '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-[240px] shrink-0 rounded-xl border border-slate-200/70 p-4 bg-gradient-to-br from-slate-50 to-white">
              <div className="text-xs font-medium text-slate-500">逾期风险提示</div>
              <div className="mt-3 space-y-2.5">
                {[
                  { label: '今日到期', value: Math.max(0, Math.round(kpi.overdue * 0.35)) },
                  { label: '3日内到期', value: Math.max(0, Math.round(kpi.overdue * 0.4)) },
                  { label: '已超7日', value: Math.max(0, Math.round(kpi.overdue * 0.25)) },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-mono font-semibold text-slate-900">{row.value}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/audits?overdue=1"
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-600 hover:gap-2 transition-all"
              >
                查看逾期清单
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        <ChartCard
          title="最新动态"
          description="整改项状态变更事件（最近 10 条）"
          right={
            <Link
              href="/audits"
              className="text-xs text-brand-700 hover:text-brand-600 font-medium flex items-center gap-1"
            >
              全部审计项
              <ChevronRight className="w-3 h-3" />
            </Link>
          }
          className="max-h-[360px] overflow-hidden"
        >
          <ul className="divide-y divide-slate-100 -m-2 max-h-full overflow-y-auto">
            {kpi.latestEvents.slice(0, 10).map((ev) => {
              const icon =
                ev.type === 'REVIEW_FAIL' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : ev.type === 'CLOSE' || ev.type === 'REVIEW_PASS' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : ev.type === 'RECTIFY' ? (
                  <FileSearch className="w-4 h-4 text-brand-500" />
                ) : ev.type === 'ASSIGN' ? (
                  <User className="w-4 h-4 text-indigo-500" />
                ) : (
                  <CircleDot className="w-4 h-4 text-slate-400" />
                );
              return (
                <li
                  key={ev.id}
                  className="flex items-start gap-3 p-2.5 hover:bg-slate-50/70 rounded-lg transition cursor-pointer"
                  onClick={() => router.push(`/audits/${ev.auditId}`)}
                >
                  <div className="mt-0.5 w-7 h-7 rounded-full bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800 leading-snug">
                      <span className="font-medium">{ev.actorName}</span>
                      <span className="mx-1 text-slate-400">·</span>
                      <span className="text-slate-500">
                        {ev.type === 'CREATE'
                          ? '创建整改项'
                          : ev.type === 'ASSIGN'
                            ? '派工'
                            : ev.type === 'RECTIFY'
                              ? '提交整改'
                              : ev.type === 'REVIEW_PASS'
                                ? '复核通过'
                                : ev.type === 'REVIEW_FAIL'
                                  ? '复核退回'
                                  : '关闭'}
                      </span>
                    </div>
                    {ev.comment && (
                      <div className="mt-0.5 text-xs text-slate-500 truncate">{ev.comment}</div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0 mt-0.5 ml-2">
                    {formatDateTime(ev.createdAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ChartCard
          title="创建 / 关闭趋势（近 12 周）"
          description="每周新增整改项与已关闭数量对比"
          className="xl:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={kpi.trend}
                margin={{ top: 10, right: 10, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <RCTooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.92)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 12,
                    padding: '10px 12px',
                  }}
                  labelStyle={{ color: '#cbd5e1', marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="新创建"
                  stroke="#2563eb"
                  strokeWidth={2.2}
                  fill="url(#colorCreated)"
                  animationDuration={800}
                />
                <Area
                  type="monotone"
                  dataKey="closed"
                  name="已关闭"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  fill="url(#colorClosed)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="即将到期 · Top 5"
          description="处理时限到期前 5 项"
          right={<Clock className="w-4 h-4 text-amber-500" />}
        >
          <div className="space-y-2.5">
            {(() => {
              const audits = mockData.audits
                .list({
                  userId: user.id,
                  role: user.role,
                  page: 1,
                  pageSize: 100,
                }).items;
              const pending = audits
                .filter((a) => a.status !== 'CLOSED')
                .sort((a, b) => +new Date(a.deadlineAt) - +new Date(b.deadlineAt))
                .slice(0, 5);
              return pending.map((a) => {
                const daysLeft = Math.ceil(
                  (+new Date(a.deadlineAt) - Date.now()) / (1000 * 60 * 60 * 24),
                );
                return (
                  <Link
                    key={a.id}
                    href={`/audits/${a.id}`}
                    className="block rounded-lg border border-slate-200/70 p-3 hover:border-brand-300 hover:shadow-card-hover transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <RiskBadge level={a.riskLevel} />
                          <StatusBadge status={a.status} />
                        </div>
                        <div className="text-sm text-slate-800 font-medium line-clamp-1">
                          {a.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <SourceBadge type={a.sourceType} />
                          <span className="text-slate-400 truncate flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {a.batchNo}
                          </span>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'shrink-0 text-right',
                          daysLeft <= 0
                            ? 'text-red-600'
                            : daysLeft <= 3
                              ? 'text-amber-600'
                              : 'text-slate-500',
                        )}
                      >
                        <div className="text-xs font-mono font-semibold">
                          {daysLeft <= 0 ? '已逾期' : `${daysLeft} 天`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {daysLeft <= 0 ? `逾期 ${Math.abs(daysLeft)} 天` : '剩余'}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        </ChartCard>
      </section>
    </div>
  );
}
