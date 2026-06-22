import Link from 'next/link';
import type { AuditFilter } from '@/app/actions/audits';
import { listAllAudits, listMyAudits } from '@/app/actions/audits';
import { RiskBadge, StatusBadge, SourceBadge } from '@/components/ui/Badges';
import { cn, formatDateTime } from '@/lib/utils';
import type { AuditStatus, RiskLevel, SourceType, UserRole } from '@/lib/utils';
import { XCircle, Clock, Search, ChevronDown, Filter } from 'lucide-react';

const STATUSES: { v: AuditStatus | ''; l: string }[] = [
  { v: '', l: '全部' },
  { v: 'CREATED', l: '已创建' },
  { v: 'ASSIGNED', l: '已派工' },
  { v: 'IN_PROGRESS', l: '整改中' },
  { v: 'PENDING_REVIEW', l: '待复核' },
  { v: 'REJECTED', l: '复核退回' },
  { v: 'CLOSED', l: '已关闭' },
];

const RISKS: { v: RiskLevel | ''; l: string; cls: string }[] = [
  { v: '', l: '全部风险', cls: '' },
  { v: 'HIGH', l: '高风险', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  { v: 'MEDIUM', l: '中风险', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { v: 'LOW', l: '低风险', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
];

interface Props {
  scope: 'all' | 'mine';
  searchParams: {
    status?: string;
    riskLevel?: string;
    sourceType?: string;
    overdueOnly?: string;
    q?: string;
  };
}

export async function AuditListTable({ scope, searchParams }: Props) {
  const filter: AuditFilter = {
    status: (searchParams.status as AuditStatus) || undefined,
    riskLevel: (searchParams.riskLevel as RiskLevel) || undefined,
    sourceType: (searchParams.sourceType as SourceType) || undefined,
    overdueOnly: searchParams.overdueOnly === '1',
    keyword: searchParams.q,
  };

  const r = scope === 'all' ? await listAllAudits(filter) : await listMyAudits(filter);
  const { user, audits } = r;

  const base = scope === 'all' ? '/audits' : '/my-tasks';
  function link(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams({ ...searchParams, ...patch } as any);
    Array.from(p.keys()).forEach((k) => {
      if (!p.get(k) || p.get(k) === 'undefined') p.delete(k);
    });
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  }

  const now = new Date();

  return (
    <div className="p-6 space-y-4 animate-slide-up">
      {scope === 'mine' && user.role === 'EXECUTOR' && (
        <ForbiddenBanner userRole={user.role} />
      )}

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <form action="">
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="搜索标题、描述、关键字..."
              className="input pl-9 pr-12"
            />
          </form>
        </div>
        <div className="flex items-center gap-1.5">
          {STATUSES.map((s) => (
            <a
              key={s.v || '_all'}
              href={link({ status: s.v })}
              className={cn(
                'chip transition',
                (searchParams.status || '') === s.v
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30'
                  : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100',
              )}
            >
              {s.l}
            </a>
          ))}
        </div>
        <div className="relative">
          <details className="group">
            <summary className="chip cursor-pointer list-none flex items-center gap-1 bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100">
              <Filter className="w-3.5 h-3.5" />
              风险等级
              <ChevronDown className="w-3 h-3 transition group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 mt-2 z-10 p-1.5 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 w-32 animate-fade-in">
              {RISKS.map((r) => (
                <a
                  key={r.v || '_all'}
                  href={link({ riskLevel: r.v })}
                  className={cn(
                    'block px-2.5 py-1.5 rounded-lg text-xs transition',
                    (searchParams.riskLevel || '') === r.v
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {r.l}
                </a>
              ))}
            </div>
          </details>
        </div>
        <a
          href={link({ overdueOnly: filter.overdueOnly ? undefined : '1' })}
          className={cn(
            'chip transition',
            filter.overdueOnly
              ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
              : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100',
          )}
        >
          只看逾期
        </a>
        <div className="text-xs text-slate-400 ml-auto font-mono">
          共 {audits.length} 条
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-4 py-3 font-medium text-left">审计项</th>
                <th className="px-4 py-3 font-medium">风险</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">来源</th>
                <th className="px-4 py-3 font-medium text-left">批次</th>
                <th className="px-4 py-3 font-medium text-left">执行人 / 复核</th>
                <th className="px-4 py-3 font-medium">期限</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    暂无符合条件的整改项
                  </td>
                </tr>
              )}
              {audits.map((a) => {
                const deadline = new Date(a.deadlineAt);
                const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
                const overdue = daysLeft < 0 && a.status !== 'CLOSED';
                return (
                  <tr
                    key={a.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60 transition"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/audits/${a.id}`} className="block">
                        <div className="text-slate-800 font-medium line-clamp-1">
                          {a.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {a.description}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <RiskBadge level={a.riskLevel as any} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={a.status as any} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SourceBadge type={(a.sourceType || a.batch.sourceType || 'COMBINED') as any} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      <Link
                        href={`/import/${a.batch.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {a.batch.batchNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      <div>{a.assignee?.name || '未分配'}</div>
                      {a.reviewer && (
                        <div className="text-slate-400 mt-0.5">
                          复核：{a.reviewer.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div
                        className={cn(
                          'flex items-center justify-center gap-1 text-[11px] font-mono',
                          overdue
                            ? 'text-rose-600'
                            : daysLeft <= 3
                              ? 'text-amber-600'
                              : 'text-slate-500',
                        )}
                      >
                        {overdue ? (
                          <>
                            <XCircle className="w-3 h-3" /> 逾期 {Math.abs(daysLeft)}d
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            {formatDateTime(deadline).slice(0, 10)}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ForbiddenBanner({ userRole }: { userRole: UserRole }) {
  const messages: Record<UserRole, string | null> = {
    EXECUTOR:
      '👋 执行角色仅可查看分配给自己的整改项。访问总览/分析/导入中心或其他同事的整改项将被自动拦截。',
    MANAGEMENT: null,
    REVIEWER: null,
  };
  const txt = messages[userRole];
  if (!txt) return null;
  return (
    <div className="card p-4 ring-1 ring-brand-200 bg-brand-50/40 text-xs text-brand-800 flex items-start gap-2">
      <span>{txt}</span>
    </div>
  );
}
