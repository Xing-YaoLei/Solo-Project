'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  Sheet,
  Mail,
  ShieldCheck,
  FileSearch,
  Clock,
  CheckCircle2,
  Loader,
  XCircle,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { mockData, type BatchDetail } from '@/lib/mock-data';
import { SourceBadge, BatchStatusBadge, RiskBadge, StatusBadge } from '@/components/ui/Badges';
import { cn, formatDateTime, formatNumber, SOURCE_LABEL } from '@/lib/utils';
import type { SourceType } from '@/lib/utils';

export default function BatchDetailPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<'overview' | 'permlog' | 'erp' | 'email' | 'audits'>('overview');
  const [detail, setDetail] = useState<BatchDetail | null>(null);

  useEffect(() => {
    if (!params.batchId) return;
    setDetail(mockData.batches.get(params.batchId));
  }, [params.batchId]);

  if (!detail) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
        <FileSearch className="w-10 h-10 opacity-50" />
        批次不存在或无权限
        <Link href="/import" className="btn-outline !py-1.5 !text-xs">
          <ArrowLeft className="w-3 h-3" />
          返回导入中心
        </Link>
      </div>
    );
  }

  const { batch } = detail;
  const tabs: { key: typeof tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'overview', label: '总览', count: 0, icon: <FileSearch className="w-3.5 h-3.5" /> },
    {
      key: 'permlog',
      label: '权限日志',
      count: detail.permLogs.length,
      icon: <Database className="w-3.5 h-3.5" />,
    },
    {
      key: 'erp',
      label: 'ERP 记录',
      count: detail.erpRecords.length,
      icon: <Sheet className="w-3.5 h-3.5" />,
    },
    {
      key: 'email',
      label: '邮件材料',
      count: detail.emails.length,
      icon: <Mail className="w-3.5 h-3.5" />,
    },
    {
      key: 'audits',
      label: '生成的整改项',
      count: detail.auditItems.length,
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/import"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回导入中心
        </Link>
        <div className="flex items-center gap-2">
          <SourceBadge type={batch.sourceType as any} />
          <BatchStatusBadge status={batch.status as any} />
        </div>
      </div>

      <section className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white flex items-center justify-center shadow-md shrink-0">
            <Link2 className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-slate-400 font-mono">BATCH ID</div>
              <h2 className="text-2xl font-mono font-semibold text-slate-900 tracking-tight">
                {batch.batchNo}
              </h2>
              {batch.status === 'PROCESSING' && (
                <span className="chip bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  <Loader className="w-3 h-3 animate-spin" />
                  数据加工中
                </span>
              )}
              {batch.status === 'SUCCESS' && (
                <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <CheckCircle2 className="w-3 h-3" />
                  可回查
                </span>
              )}
              {batch.status === 'FAILED' && (
                <span className="chip bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20">
                  <XCircle className="w-3 h-3" />
                  失败
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {SOURCE_LABEL[batch.sourceType as SourceType]} · {batch.fileName ?? '未命名文件'}
            </p>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCell label="导入人" value={batch.createdByName} />
              <StatCell
                label="导入时间"
                value={formatDateTime(batch.createdAt).split(' ')[0]}
                sub={formatDateTime(batch.createdAt).split(' ')[1] || ''}
              />
              <StatCell
                label="原始记录"
                value={formatNumber(batch.recordCount)}
                mono
                accent="text-blue-600"
              />
              <StatCell
                label="生成整改项"
                value={formatNumber(detail.auditItems.length)}
                mono
                accent="text-brand-700"
              />
              <StatCell
                label="耗时"
                value={`${(0.42 + Math.random() * 2.3).toFixed(2)} s`}
                mono
                sub="解析 + 加工"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-1 p-1 bg-slate-50 rounded-xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5',
                tab === t.key
                  ? 'bg-white text-brand-800 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.icon}
              {t.label}
              {t.count > 0 && (
                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.5 rounded-full',
                    tab === t.key ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {formatNumber(t.count)}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        {tab === 'overview' && <OverviewTab detail={detail} />}
        {tab === 'permlog' && <PermLogTab data={detail.permLogs} />}
        {tab === 'erp' && <ErpTab data={detail.erpRecords} />}
        {tab === 'email' && <EmailTab data={detail.emails} />}
        {tab === 'audits' && <AuditsTab data={detail.auditItems} />}
      </section>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  mono,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white px-3 py-2.5">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={cn('text-base font-semibold mt-0.5', mono && 'font-mono', accent)}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function OverviewTab({ detail }: { detail: BatchDetail }) {
  const counts = {
    HIGH: detail.auditItems.filter((a) => a.riskLevel === 'HIGH').length,
    MEDIUM: detail.auditItems.filter((a) => a.riskLevel === 'MEDIUM').length,
    LOW: detail.auditItems.filter((a) => a.riskLevel === 'LOW').length,
    sum: detail.auditItems.length,
  };
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 space-y-4">
        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            风险分布（本批次生成）
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {counts.sum ? (
              <>
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600"
                  style={{ width: `${(counts.HIGH / counts.sum) * 100}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                  style={{ width: `${(counts.MEDIUM / counts.sum) * 100}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${(counts.LOW / counts.sum) * 100}%` }}
                />
              </>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { k: 'HIGH', n: counts.HIGH, c: 'text-red-600', bg: 'bg-red-50' },
              { k: 'MEDIUM', n: counts.MEDIUM, c: 'text-amber-600', bg: 'bg-amber-50' },
              { k: 'LOW', n: counts.LOW, c: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((r) => (
              <div key={r.k} className={cn('rounded-lg p-2.5', r.bg)}>
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {r.k === 'HIGH' ? '高风险' : r.k === 'MEDIUM' ? '中风险' : '低风险'}
                </div>
                <div className={cn('text-xl font-mono font-semibold mt-0.5', r.c)}>
                  {formatNumber(r.n)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-600" />
            数据加工流水日志
          </div>
          <ul className="space-y-2 text-[11px] font-mono text-slate-600 bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <li>
              <span className="text-slate-500">[00:00:01]</span>{' '}
              <span className="text-emerald-400">INFO</span> 开始导入批次 {detail.batch.batchNo}
            </li>
            <li>
              <span className="text-slate-500">[00:00:02]</span>{' '}
              <span className="text-emerald-400">INFO</span> 检测源类型：
              {SOURCE_LABEL[detail.batch.sourceType as SourceType]}
            </li>
            <li>
              <span className="text-slate-500">[00:00:03]</span>{' '}
              <span className="text-sky-400">STEP1</span> 解析 {formatNumber(detail.batch.recordCount)} 条原始记录
            </li>
            <li>
              <span className="text-slate-500">[00:00:05]</span>{' '}
              <span className="text-sky-400">STEP2</span> 规则过滤与去重
            </li>
            <li>
              <span className="text-slate-500">[00:00:08]</span>{' '}
              <span className="text-sky-400">STEP3</span> 合并权限日志 / ERP / 邮件 三源关联
            </li>
            <li>
              <span className="text-slate-500">[00:00:11]</span>{' '}
              <span className="text-sky-400">STEP4</span> 按派工规则匹配执行人
            </li>
            <li>
              <span className="text-slate-500">[00:00:13]</span>{' '}
              <span className="text-emerald-400">OK</span> 生成 {formatNumber(detail.auditItems.length)} 条整改项
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4 space-y-3">
        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          本批次关联整改项（最近 6 条）
        </div>
        <ul className="space-y-2">
          {detail.auditItems.slice(0, 6).map((a) => (
            <Link
              key={a.id}
              href={`/audits/${a.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-2.5 hover:border-brand-300 hover:shadow-sm transition"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <RiskBadge level={a.riskLevel} />
                <StatusBadge status={a.status} />
              </div>
              <div className="text-xs text-slate-800 line-clamp-1">{a.title}</div>
              <div className="mt-1 text-[10px] text-slate-400 font-mono">
                {a.dispatchRule} · {formatDateTime(a.createdAt).split(' ')[0]}
              </div>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PermLogTab({ data }: { data: BatchDetail['permLogs'] }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs min-w-[720px]">
        <thead className="bg-slate-50/60 border-y border-slate-100">
          <tr>
            <th className="th">发生时间</th>
            <th className="th">用户 ID</th>
            <th className="th">操作</th>
            <th className="th">资源 / 模块</th>
            <th className="th">IP 地址</th>
          </tr>
        </thead>
        <tbody>
          {data.map((l, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="td font-mono text-slate-500">{formatDateTime(l.happenedAt)}</td>
              <td className="td font-mono text-slate-700">{l.userId ?? '-'}</td>
              <td className="td">
                <span className="chip bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 font-mono">
                  {l.action}
                </span>
              </td>
              <td className="td text-slate-700">{l.resource}</td>
              <td className="td font-mono text-slate-500">{l.ipAddress ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErpTab({ data }: { data: BatchDetail['erpRecords'] }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs min-w-[640px]">
        <thead className="bg-slate-50/60 border-y border-slate-100">
          <tr>
            <th className="th">发生时间</th>
            <th className="th">单据号</th>
            <th className="th text-right">金额 (¥)</th>
            <th className="th">部门</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="td font-mono text-slate-500">{formatDateTime(r.happenedAt)}</td>
              <td className="td font-mono text-slate-800">{r.documentNo}</td>
              <td className="td font-mono text-right text-slate-800">
                {r.amount?.toFixed(2) ?? '-'}
              </td>
              <td className="td text-slate-600">{r.department ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmailTab({ data }: { data: BatchDetail['emails'] }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs min-w-[760px]">
        <thead className="bg-slate-50/60 border-y border-slate-100">
          <tr>
            <th className="th">发送时间</th>
            <th className="th">主题</th>
            <th className="th">发件人</th>
            <th className="th">收件人</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => (
            <tr key={i} className="hover:bg-slate-50/60">
              <td className="td font-mono text-slate-500 w-44">{formatDateTime(m.sentAt)}</td>
              <td className="td text-slate-800">{m.subject}</td>
              <td className="td font-mono text-slate-600">{m.sender}</td>
              <td className="td font-mono text-slate-500 max-w-[240px] truncate">
                {m.recipients.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditsTab({ data }: { data: BatchDetail['auditItems'] }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-xs min-w-[820px]">
        <thead className="bg-slate-50/60 border-y border-slate-100">
          <tr>
            <th className="th w-64">整改项</th>
            <th className="th">风险</th>
            <th className="th">状态</th>
            <th className="th">派工规则</th>
            <th className="th">截止日期</th>
            <th className="th">创建时间</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="hover:bg-brand-50/30 transition">
              <td className="td">
                <Link href={`/audits/${a.id}`} className="block min-w-0">
                  <div className="text-slate-800 font-medium line-clamp-1 hover:text-brand-700">
                    {a.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{a.id.slice(0, 16)}...</div>
                </Link>
              </td>
              <td className="td">
                <RiskBadge level={a.riskLevel} />
              </td>
              <td className="td">
                <StatusBadge status={a.status} />
              </td>
              <td className="td text-slate-600">{a.dispatchRule}</td>
              <td className="td font-mono text-slate-500">{formatDateTime(a.deadlineAt).split(' ')[0]}</td>
              <td className="td font-mono text-slate-500">{formatDateTime(a.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
