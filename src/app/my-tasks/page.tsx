'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckSquare,
  Clock,
  Target,
  TrendingUp,
  Filter,
  ChevronRight,
  FileSearch,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/store/session';
import { mockData } from '@/lib/mock-data';
import { KpiCard } from '@/components/ui/KpiCard';
import { RiskBadge, StatusBadge, SourceBadge } from '@/components/ui/Badges';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  cn,
  STATUS_LABEL,
  RISK_LABEL,
} from '@/lib/utils';
import type { AuditStatus, RiskLevel } from '@/lib/utils';

const STATUS_FILTERS: { key: AuditStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: '全部' },
  { key: 'CREATED', label: STATUS_LABEL.CREATED },
  { key: 'ASSIGNED', label: STATUS_LABEL.ASSIGNED },
  { key: 'IN_PROGRESS', label: STATUS_LABEL.IN_PROGRESS },
  { key: 'PENDING_REVIEW', label: STATUS_LABEL.PENDING_REVIEW },
  { key: 'REJECTED', label: STATUS_LABEL.REJECTED },
  { key: 'CLOSED', label: STATUS_LABEL.CLOSED },
];

export default function MyTasksPage() {
  const { user } = useSession();
  const [stats, setStats] = useState<ReturnType<typeof mockData.kpi.myStats> | null>(null);
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    setStats(mockData.kpi.myStats(user.id));
    setPage(1);
  }, [user]);

  const pageSize = 10;

  const data = useMemo(() => {
    if (!user) return { items: [], total: 0, page: 1, pageSize };
    const filters: Record<string, any> = {};
    if (statusFilter !== 'ALL') filters.status = statusFilter;
    if (riskFilter !== 'ALL') filters.riskLevel = riskFilter;
    if (overdueOnly) filters.overdueOnly = true;
    return mockData.audits.list({
      userId: user.id,
      role: user.role === 'EXECUTOR' ? 'EXECUTOR' : user.role,
      page,
      pageSize,
      filters,
    });
  }, [user, page, statusFilter, riskFilter, overdueOnly]);

  const isExecutor = user?.role === 'EXECUTOR';
  const myLabel = isExecutor ? '我的整改' : '整改清单';

  return (
    <div className="space-y-5">
      {isExecutor && stats ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <KpiCard
            label={`${myLabel}总数`}
            value={formatNumber(stats.totalAssigned)}
            accent="brand"
            progress={stats.totalAssigned ? stats.totalAssigned / stats.totalAssigned : 0}
            sub="全部分配给我的项"
          />
          <KpiCard
            label="待开始"
            value={formatNumber(stats.pending)}
            trend={stats.pending ? -stats.pending * 2 : 0}
            accent="warning"
            progress={stats.totalAssigned ? stats.pending / stats.totalAssigned : 0}
            sub="尚未开始整改"
          />
          <KpiCard
            label="首次解决率"
            value={formatPercent(stats.firstPassRate)}
            trend={+4.2}
            accent="success"
            progress={stats.firstPassRate}
            sub="仅显示我自己的表现"
            footer={
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Target className="w-3 h-3" />
                目标 ≥ 85%
              </div>
            }
          />
          <KpiCard
            label="平均整改耗时"
            value={`${stats.avgDays.toFixed(1)} 天`}
            trend={-6.8}
            accent="brand"
            progress={Math.min(1, stats.avgDays / 14)}
            sub="含复核周转时间"
          />
        </section>
      ) : null}

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-600" />
              {myLabel}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isExecutor
                ? '仅显示分配给您本人的整改项，按角色隔离'
                : '您有权限查看的全部整改项'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg ring-1 ring-slate-200 bg-slate-50 p-0.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setStatusFilter(f.key);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition',
                    statusFilter === f.key
                      ? 'bg-white text-brand-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <select
              className="input w-auto text-xs"
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="ALL">全部风险等级</option>
              <option value="HIGH">{RISK_LABEL.HIGH}</option>
              <option value="MEDIUM">{RISK_LABEL.MEDIUM}</option>
              <option value="LOW">{RISK_LABEL.LOW}</option>
            </select>
            <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200 bg-white text-xs text-slate-700 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setOverdueOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-3.5 h-3.5 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
              />
              仅看已逾期
            </label>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-slate-50/60 border-y border-slate-100">
              <tr>
                <th className="th w-48">审计项</th>
                <th className="th w-28">风险</th>
                <th className="th w-28">状态</th>
                <th className="th w-28">来源</th>
                <th className="th w-40">派工规则</th>
                <th className="th w-28">截止日期</th>
                <th className="th w-24">退回</th>
                <th className="th w-28">创建时间</th>
                <th className="th w-10 text-right pr-6"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => {
                const daysLeft = Math.ceil(
                  (+new Date(a.deadlineAt) - Date.now()) / (1000 * 60 * 60 * 24),
                );
                const overdue = a.status !== 'CLOSED' && daysLeft < 0;
                return (
                  <tr
                    key={a.id}
                    className="group hover:bg-brand-50/30 transition"
                  >
                    <td className="td">
                      <Link href={`/audits/${a.id}`} className="block min-w-0">
                        <div className="font-medium text-slate-800 line-clamp-1 group-hover:text-brand-700">
                          {a.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-400 font-mono">
                          批次 {a.batchNo}
                        </div>
                      </Link>
                    </td>
                    <td className="td">
                      <RiskBadge level={a.riskLevel} />
                    </td>
                    <td className="td">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="td">
                      <SourceBadge type={a.sourceType} />
                    </td>
                    <td className="td text-slate-600">{a.dispatchRule}</td>
                    <td className="td">
                      <div
                        className={cn(
                          'font-mono text-xs',
                          overdue
                            ? 'text-red-600 font-semibold'
                            : daysLeft <= 3
                              ? 'text-amber-600'
                              : 'text-slate-600',
                        )}
                      >
                        {formatDate(a.deadlineAt)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {overdue
                          ? `已逾期 ${Math.abs(daysLeft)} 天`
                          : a.status === 'CLOSED'
                            ? '已关闭'
                            : `剩 ${daysLeft} 天`}
                      </div>
                    </td>
                    <td className="td">
                      {a.revisionCount > 0 ? (
                        <span className="chip bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          {a.revisionCount} 次
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="td text-xs text-slate-500">
                      {formatDateTime(a.createdAt)}
                    </td>
                    <td className="td text-right pr-6">
                      <Link
                        href={`/audits/${a.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 opacity-0 group-hover:opacity-100 transition"
                      >
                        详情
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="td text-center py-12 text-slate-400 text-sm">
                    <FileSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    当前筛选条件下暂无整改项
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {data.total > pageSize && (
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              共 <span className="font-mono font-semibold text-slate-700">{data.total}</span> 条，
              第 <span className="font-mono">{page}</span> /{' '}
              <span className="font-mono">{Math.ceil(data.total / pageSize)}</span> 页
            </div>
            <div className="inline-flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-outline !px-3 !py-1.5 text-xs"
              >
                上一页
              </button>
              {Array.from(
                { length: Math.min(5, Math.ceil(data.total / pageSize)) },
                (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, Math.ceil(data.total / pageSize) - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-mono transition',
                        page === p
                          ? 'bg-brand-800 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      {p}
                    </button>
                  );
                },
              )}
              <button
                onClick={() =>
                  setPage((p) => Math.min(Math.ceil(data.total / pageSize), p + 1))
                }
                disabled={page >= Math.ceil(data.total / pageSize)}
                className="btn-outline !px-3 !py-1.5 text-xs"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
