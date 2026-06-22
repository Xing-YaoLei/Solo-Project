import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getBatchDetail } from '@/app/actions/batches';
import { BatchStatusBadge, RiskBadge, SourceBadge, StatusBadge } from '@/components/ui/Badges';
import { cn, formatDateTime, formatNumber, SOURCE_LABEL } from '@/lib/utils';
import type { SourceType } from '@/lib/utils';
import {
  ArrowLeft,
  Database,
  Sheet,
  Mail,
  ShieldCheck,
  FileSearch,
  Clock,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';

type TabKey = 'overview' | 'perm' | 'erp' | 'email' | 'audits';

export default async function BatchDetailPage({
  params,
  searchParams,
}: {
  params: { batchId: string };
  searchParams: { tab?: string };
}) {
  const res = await getBatchDetail(params.batchId);
  if (!res) redirect('/import');
  const { user, batch } = res;

  const tab: TabKey = (
    ['overview', 'perm', 'erp', 'email', 'audits'].includes(searchParams.tab as any)
      ? searchParams.tab
      : 'overview'
  ) as TabKey;

  const base = `/import/${batch.id}`;
  const tabs: { k: TabKey; label: string; icon: any; badge?: number }[] = [
    { k: 'overview', label: '总览', icon: FileSearch },
    { k: 'perm', label: '权限日志', icon: Database, badge: batch.permLogs.length },
    { k: 'erp', label: 'ERP 导出', icon: Sheet, badge: batch.erpRecords.length },
    { k: 'email', label: '邮件材料', icon: Mail, badge: batch.emails.length },
    { k: 'audits', label: '生成整改项', icon: ShieldCheck, badge: batch.auditItems.length },
  ];

  const logs: Array<{ t: string; step: string; msg: string }> = batch.processLog
    ? JSON.parse(batch.processLog)
    : [];

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/import"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回批次列表
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 font-mono">{batch.batchNo}</h1>
            <BatchStatusBadge status={batch.status as any} />
            <SourceBadge type={batch.sourceType as SourceType} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {SOURCE_LABEL[batch.sourceType as keyof typeof SOURCE_LABEL] || '三源合并'} ·{' '}
            {batch.fileName || '未命名文件'} · 创建人 {batch.createdBy.name} · {formatDateTime(batch.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="chip bg-slate-50 ring-1 ring-slate-200">
            <Database className="w-3 h-3 inline mr-1" />
            权限 {batch.permLogs.length}
          </span>
          <span className="chip bg-slate-50 ring-1 ring-slate-200">
            <Sheet className="w-3 h-3 inline mr-1" />
            ERP {batch.erpRecords.length}
          </span>
          <span className="chip bg-slate-50 ring-1 ring-slate-200">
            <Mail className="w-3 h-3 inline mr-1" />
            邮件 {batch.emails.length}
          </span>
          <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-200">
            <ShieldCheck className="w-3 h-3 inline mr-1" />
            整改项 {batch.auditItems.length}
          </span>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.k}
            href={`${base}${t.k !== 'overview' ? `?tab=${t.k}` : ''}`}
            className={cn(
              'px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition -mb-px flex items-center gap-1.5',
              tab === t.k
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {typeof t.badge === 'number' && (
              <span
                className={cn(
                  'ml-1 text-[10px] px-1.5 py-0.5 rounded-full',
                  tab === t.k ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card p-5 xl:col-span-1 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              指标加工流水
            </h3>
            <div className="rounded-xl bg-slate-900 p-4 space-y-1.5 max-h-96 overflow-auto font-mono text-[11px]">
              {logs.length === 0 && <div className="text-slate-500">无加工日志</div>}
              {logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">{l.t.slice(11, 19)}</span>
                  <span
                    className={cn(
                      'shrink-0 w-6',
                      l.step === 'OK'
                        ? 'text-emerald-400'
                        : /^\d$/.test(l.step)
                          ? 'text-sky-400'
                          : 'text-amber-400',
                    )}
                  >
                    {l.step === 'OK' ? '✓' : l.step}
                  </span>
                  <span className="text-slate-200">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 xl:col-span-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              生成的整改项（{batch.auditItems.length} 条）
            </h3>
            <div className="space-y-2">
              {batch.auditItems.slice(0, 12).map((a: any) => (
                <Link
                  key={a.id}
                  href={`/audits/${a.id}`}
                  className="block p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition"
                >
                  <div className="flex flex-wrap items-start gap-2 mb-1">
                    <RiskBadge level={a.riskLevel as any} />
                    <StatusBadge status={a.status as any} />
                    {a.assignee && (
                      <span className="chip bg-slate-50 text-slate-600 ring-1 ring-slate-200">
                        执行人：{a.assignee.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-800 line-clamp-1">{a.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 font-mono">
                    期限 {formatDateTime(a.deadlineAt).slice(0, 10)} · {a.dispatchRule}
                  </div>
                </Link>
              ))}
              {batch.auditItems.length > 12 && (
                <Link
                  href={`${base}?tab=audits`}
                  className="block text-center py-2 text-xs text-brand-600 hover:underline"
                >
                  查看全部 {batch.auditItems.length} 条 →
                </Link>
              )}
              {batch.auditItems.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">尚未生成整改项</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'perm' && (
        <DataTable title="权限日志原始记录" count={batch.permLogs.length} cols={['用户', '动作', '资源', 'IP', '风险', '发生时间']}>
          {batch.permLogs.map((p: any) => (
            <tr key={p.id} className="border-t border-slate-100">
              <Td>{p.userName ?? p.userId}</Td>
              <Td className="font-medium text-slate-800">{p.action}</Td>
              <Td className="font-mono text-[11px] text-slate-600">{p.resource}</Td>
              <Td className="font-mono text-[11px]">{p.ipAddress ?? '-'}</Td>
              <Td className="text-center">{p.riskLevel ? <RiskBadge level={p.riskLevel as any} /> : '-'}</Td>
              <Td className="font-mono text-[11px] text-slate-500">{formatDateTime(p.happenedAt)}</Td>
            </tr>
          ))}
        </DataTable>
      )}

      {tab === 'erp' && (
        <DataTable title="ERP 导出原始单据" count={batch.erpRecords.length} cols={['单据号', '类型', '金额', '部门', '操作人', '审批人', '风险', '发生时间']}>
          {batch.erpRecords.map((e: any) => (
            <tr key={e.id} className="border-t border-slate-100">
              <Td className="font-mono">{e.documentNo}</Td>
              <Td>
                <span className="chip bg-slate-50 ring-1 ring-slate-200 text-slate-600">
                  {e.documentType || '-'}
                </span>
              </Td>
              <Td className="font-mono text-slate-800">¥ {formatNumber(e.amount ?? 0)}</Td>
              <Td>{e.department || '-'}</Td>
              <Td>{e.operator || '-'}</Td>
              <Td>{e.approver || '-'}</Td>
              <Td className="text-center">{e.riskLevel ? <RiskBadge level={e.riskLevel as any} /> : '-'}</Td>
              <Td className="font-mono text-[11px] text-slate-500">{formatDateTime(e.happenedAt)}</Td>
            </tr>
          ))}
        </DataTable>
      )}

      {tab === 'email' && (
        <DataTable title="邮件材料原始记录" count={batch.emails.length} cols={['主题', '发件人', '收件人', '摘要', '风险', '发送时间']}>
          {batch.emails.map((e: any) => {
            const recipients: string[] = JSON.parse(e.recipients || '[]');
            return (
              <tr key={e.id} className="border-t border-slate-100 align-top">
                <Td className="font-medium text-slate-800">{e.subject}</Td>
                <Td className="font-mono text-[11px] text-slate-600">{e.sender}</Td>
                <Td className="font-mono text-[11px] text-slate-500 max-w-[220px]">
                  <div className="flex flex-wrap gap-1">
                    {recipients.map((r, i) => (
                      <span key={i} className="chip bg-slate-50 ring-1 ring-slate-200">{r}</span>
                    ))}
                  </div>
                </Td>
                <Td className="text-slate-600 text-xs leading-relaxed">{e.summary}</Td>
                <Td className="text-center">{e.riskLevel ? <RiskBadge level={e.riskLevel as any} /> : '-'}</Td>
                <Td className="font-mono text-[11px] text-slate-500">{formatDateTime(e.sentAt)}</Td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {tab === 'audits' && (
        <DataTable
          title={`批次生成的整改项（${batch.auditItems.length} 条）`}
          count={batch.auditItems.length}
          cols={['标题', '风险', '状态', '来源', '派工规则', '执行人 / 复核', '期限']}
        >
          {batch.auditItems.map((a: any) => (
            <tr key={a.id} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
              <Td>
                <Link href={`/audits/${a.id}`} className="font-medium text-brand-700 hover:underline line-clamp-1">
                  {a.title}
                </Link>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{a.description}</div>
              </Td>
              <Td className="text-center"><RiskBadge level={a.riskLevel as any} /></Td>
              <Td className="text-center"><StatusBadge status={a.status as any} /></Td>
              <Td className="text-center"><SourceBadge type={(a.sourceType || batch.sourceType) as any} /></Td>
              <Td>{a.dispatchRule}</Td>
              <Td className="text-xs">
                <div>{a.assignee?.name || '未分配'}</div>
                <div className="text-slate-400 mt-0.5">复核：{a.reviewer?.name || '-'}</div>
              </Td>
              <Td className="font-mono text-[11px] text-slate-500">
                {formatDateTime(a.deadlineAt).slice(0, 10)}
              </Td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

function DataTable({
  title, count, cols, children,
}: {
  title: string; count: number; cols: string[]; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="font-mono text-xs text-slate-500">{count} 条记录</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500">
              {cols.map((c) => (
                <th key={c} className="px-4 py-3 font-medium text-left">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td
                  colSpan={cols.length}
                  className="px-4 py-16 text-center text-slate-400 text-xs"
                >
                  暂无数据
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Td({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn('px-4 py-3 text-xs text-slate-600', className)}>{children}</td>;
}
