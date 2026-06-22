import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getOverviewKpi } from '@/app/actions/analytics';
import { KpiCard } from '@/components/ui/KpiCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { RiskBadge, StatusBadge, SourceBadge } from '@/components/ui/Badges';
import { TrendAreaChart } from '@/components/charts/DashboardTrendChart';
import { cn, formatPercent, formatDateShort, formatNumber } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Target,
  XCircle,
  Clock,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

export default async function DashboardPage() {
  const data = await getOverviewKpi();
  const { user, kpi, weeks, top5, timeline } = data;

  if (user.role === 'EXECUTOR') redirect('/my-tasks');

  const totalRisk = kpi.riskCounts.HIGH + kpi.riskCounts.MEDIUM + kpi.riskCounts.LOW || 1;
  const risks = [
    { key: 'HIGH', label: '高风险', value: kpi.riskCounts.HIGH, color: 'bg-risk-high' },
    { key: 'MEDIUM', label: '中风险', value: kpi.riskCounts.MEDIUM, color: 'bg-risk-medium' },
    { key: 'LOW', label: '低风险', value: kpi.riskCounts.LOW, color: 'bg-risk-low' },
  ];

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="在途整改"
          value={formatNumber(kpi.openCount)}
          hint={`占总数 ${kpi.totalCount} 项`}
          trend={{ delta: -2.4, upGood: false }}
          icon={LayoutDashboard}
          accent="brand"
          progress={{ value: kpi.openCount, max: kpi.totalCount }}
        />
        <KpiCard
          title="逾期风险"
          value={formatNumber(kpi.overdueCount)}
          hint="超出处理时限，需要立即关注"
          trend={{ delta: 12.8, upGood: false }}
          icon={AlertTriangle}
          accent="rose"
          progress={{ value: kpi.overdueCount, max: kpi.openCount || 1 }}
        />
        <KpiCard
          title="首次解决率"
          value={formatPercent(kpi.firstPassRate)}
          hint="复核一次通过 · 高质量整改"
          trend={{ delta: 3.6, upGood: true }}
          icon={Target}
          accent="emerald"
          progress={{ value: Math.round(kpi.firstPassRate * 100), max: 100 }}
        />
        <KpiCard
          title="整改关闭率"
          value={formatPercent(kpi.closeRate)}
          hint={`已关闭 ${kpi.closedCount} / ${kpi.totalCount}`}
          trend={{ delta: 5.1, upGood: true }}
          icon={CheckCircle2}
          accent="amber"
          progress={{ value: kpi.closedCount, max: kpi.totalCount || 1 }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard
          title="风险态势分布"
          description="按风险等级统计当前整改项分布与占比"
          className="xl:col-span-1"
        >
          <div className="space-y-4">
            {risks.map((r) => (
              <div key={r.key}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={cn('w-2 h-2 rounded-full', r.color)} />
                    {r.label}
                  </span>
                  <span className="font-mono text-slate-700">
                    {r.value} 项 · {((r.value / totalRisk) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', r.color)}
                    style={{ width: `${(r.value / totalRisk) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 flex gap-2">
              <Link
                href="/audits?riskLevel=HIGH"
                className="btn-secondary text-xs py-2 px-3 bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100"
              >
                查看逾期清单
                <ArrowRight className="w-3 h-3" />
              </Link>
              <Link
                href="/audits"
                className="btn-secondary text-xs py-2 px-3"
              >
                全部审计项
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </ChartCard>

        <ChartCard
          title="最新动态"
          description="整改项状态变更事件（最近 10 条）"
          className="xl:col-span-2"
        >
          <ol className="relative border-l border-slate-200 ml-2 space-y-3">
            {timeline.map((ev: any, i: number) => (
              <li key={i} className="ml-5">
                <span
                  className={cn(
                    'absolute -left-1.5 w-3 h-3 rounded-full ring-4 ring-white',
                    ev.kind === 'CLOSED'
                      ? 'bg-emerald-500'
                      : ev.kind === 'REJECTED'
                        ? 'bg-rose-500'
                        : ev.kind === 'PENDING_REVIEW'
                          ? 'bg-amber-500'
                          : ev.kind === 'IN_PROGRESS'
                            ? 'bg-brand-500'
                            : 'bg-slate-400',
                  )}
                />
                <Link
                  href={`/audits/${ev.auditId}`}
                  className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{ev.user}</span> ·{' '}
                      <StatusBadge status={ev.kind as any} />
                      <span className="text-slate-500 ml-2 text-xs">{ev.detail}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0">
                      {formatDateShort(new Date(ev.createdAt))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard
          title="创建 / 关闭趋势（近 12 周）"
          description="每周新增整改项与已关闭数量对比"
          className="xl:col-span-2"
        >
          <TrendAreaChart data={weeks} />
        </ChartCard>

        <ChartCard title="即将到期 · Top 5" description="处理时限到期前 5 项">
          <ul className="space-y-2">
            {top5.map((it: any, i: number) => {
              const now = new Date();
              const due = new Date(it.deadlineAt);
              const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);
              const overdue = days < 0;
              return (
                <li key={i}>
                  <Link
                    href={`/audits/${it.id}`}
                    className="block p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition"
                  >
                    <div className="flex items-start gap-2">
                      <RiskBadge level={it.riskLevel as any} />
                      <StatusBadge status={it.status as any} />
                      <SourceBadge type={(it.batch?.sourceType ?? 'COMBINED') as any} />
                    </div>
                    <div className="mt-1.5 text-sm text-slate-800 font-medium line-clamp-1">{it.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">{it.batch?.batchNo}</span>
                      <span
                        className={cn(
                          'flex items-center gap-1 font-mono',
                          overdue ? 'text-rose-600' : days <= 2 ? 'text-amber-600' : 'text-slate-500',
                        )}
                      >
                        {overdue ? (
                          <>
                            <XCircle className="w-3 h-3" /> 已逾期 · 逾期 {Math.abs(days)} 天
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> {days} 天剩余
                          </>
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
