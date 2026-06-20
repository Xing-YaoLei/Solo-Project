'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Target, UserCheck, Clock, Shield, FileText, CheckCircle, AlertTriangle,
  User as UserIcon, Send, Gavel,
} from 'lucide-react';
import { api } from '@/lib/api';
import { fmtDateTime, STATUS_STYLES, LABELS } from '@/lib/utils';

const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'badge bg-emerald-100 text-emerald-700',
  MEDIUM: 'badge bg-amber-100 text-amber-700',
  HIGH: 'badge bg-orange-100 text-orange-700',
  CRITICAL: 'badge bg-rose-100 text-rose-700',
};

const STATUS_TRANSITIONS = [
  { value: 'INVESTIGATING', label: '开始调查' },
  { value: 'PENDING_RESPONSE', label: '等待反馈' },
  { value: 'RESOLVED', label: '已解决' },
  { value: 'CLOSED', label: '关闭' },
  { value: 'ESCALATED', label: '升级处理' },
  { value: 'OPEN', label: '重新打开' },
];

export default function ExceptionDetailPage({ params }: { params: { id: string } }) {
  const [exc, setExc] = useState<any>(null);

  const refresh = () => api.get(`/exceptions/${params.id}`).then(setExc);
  useEffect(() => { refresh(); }, [params.id]);

  const changeStatus = async (st: string) => {
    const resolution = st === 'RESOLVED' ? prompt('请输入解决方案') : undefined;
    const result = st === 'CLOSED' || st === 'RESOLVED' ? prompt('处理结果说明', resolution) : undefined;
    await api.put(`/exceptions/${params.id}/status`, {
      status: st, resolution, handlingResult: result,
    });
    refresh();
  };

  const updateLiability = async () => {
    const opts = Object.entries(LABELS.LiabilityParty).map(([k, v]) => `  [${k}] ${v}`).join('\n');
    const party = prompt(`请输入责任方代码：\n${opts}`, exc?.liabilityParty || 'UNCLEAR');
    if (!party) return;
    const detail = prompt('责任说明（可选）', exc?.liabilityDetail || '');
    await api.put(`/exceptions/${params.id}/liability`, { liabilityParty: party, liabilityDetail: detail });
    refresh();
  };

  const assign = async () => {
    const name = prompt('处理人姓名', exc?.handlerName || '');
    if (!name) return;
    const id = prompt('处理人 ID', exc?.handlerId || String(Math.random()).slice(2, 8));
    await api.put(`/exceptions/${params.id}/assign`, { handlerId: id, handlerName: name });
    refresh();
  };

  if (!exc) return <div className="text-slate-500">加载中...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/exceptions" className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> 返回异常列表
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 font-mono">{exc.exceptionNo}</h1>
              <span className="badge bg-indigo-50 text-indigo-700">{LABELS.ExceptionType[exc.type] || exc.type}</span>
              <span className={STATUS_STYLES[exc.status]}>{LABELS.ExceptionStatus[exc.status] || exc.status}</span>
              <span className={SEVERITY_STYLES[exc.severity]}>{LABELS.Severity[exc.severity] || exc.severity}</span>
            </div>
            <div className="text-base text-slate-800 mt-2">{exc.title}</div>
            <div className="text-xs text-slate-500 mt-1">
              创建 {fmtDateTime(exc.createdAt)}
              {exc.closedAt && ` · 关闭 ${fmtDateTime(exc.closedAt)}`}
              {exc.deadline && ` · 截止 ${fmtDateTime(exc.deadline)}`}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_TRANSITIONS.map((t) => (
              <button
                key={t.value}
                className={`btn-outline text-xs ${exc.status === t.value ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={exc.status === t.value}
                onClick={() => changeStatus(t.value)}
              >
                {t.value === 'RESOLVED' && <CheckCircle className="w-3.5 h-3.5" />}
                {t.value === 'ESCALATED' && <AlertTriangle className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-5 col-span-1 space-y-6">
          <Section title="责任归属" icon={Gavel}>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">责任方</span>
                <span className={STATUS_STYLES[exc.liabilityParty] || 'badge bg-slate-100 text-slate-600'}>
                  {LABELS.LiabilityParty[exc.liabilityParty] || exc.liabilityParty}
                </span>
              </div>
              {exc.liabilityDetail && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-sm text-slate-700">
                  {exc.liabilityDetail}
                </div>
              )}
            </div>
            <button className="btn-outline w-full text-xs" onClick={updateLiability}>
              <Gavel className="w-3.5 h-3.5" /> 判定/更新责任
            </button>
          </Section>

          <Section title="处理人" icon={UserCheck}>
            {exc.handlerName ? (
              <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{exc.handlerName}</div>
                    <div className="text-xs text-slate-500">ID: {exc.handlerId}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-slate-300 text-center text-sm text-slate-400 mb-3">
                尚未分配处理人
              </div>
            )}
            <button className="btn-outline w-full text-xs" onClick={assign}>
              <UserCheck className="w-3.5 h-3.5" /> {exc.handlerName ? '重新分配' : '分配处理人'}
            </button>
          </Section>

          <Section title="影响范围" icon={Target}>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900 whitespace-pre-wrap">
              {exc.impactScope || '-'}
            </div>
            {(exc.affectedOrders?.length || 0) > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-1.5">关联订单</div>
                <div className="space-y-1">
                  {exc.affectedOrders.map((o: string) => (
                    <div key={o} className="text-xs font-mono text-brand-600">· {o}</div>
                  ))}
                </div>
              </div>
            )}
            {(exc.affectedSeats?.length || 0) > 0 && (
              <div className="mt-3">
                <div className="text-xs text-slate-500 mb-1.5">受影响座位</div>
                <div className="flex flex-wrap gap-1">
                  {exc.affectedSeats.map((s: any, i: number) => (
                    <span key={i} className="badge bg-rose-50 text-rose-700">{s.row}{s.col}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          <Section title="关联信息" icon={FileText}>
            <div className="space-y-2 text-sm">
              {exc.activity && (
                <div className="flex justify-between">
                  <span className="text-slate-500">活动</span>
                  <span>{exc.activity.name}</span>
                </div>
              )}
              {exc.order && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">订单</span>
                  <Link href={`/orders/${exc.orderId}`} className="font-mono text-brand-600 hover:underline">
                    {exc.order.orderNo}
                  </Link>
                </div>
              )}
              {exc.order && (
                <div className="flex justify-between">
                  <span className="text-slate-500">客户</span>
                  <span>{exc.order.customerName} · {exc.order.customerPhone}</span>
                </div>
              )}
            </div>
          </Section>
        </div>

        <div className="card p-5 col-span-2 space-y-6">
          <Section title="问题描述" icon={FileText}>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
              {exc.description}
            </div>
          </Section>

          <Section title="解决方案 & 处理结果" icon={CheckCircle}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1.5">解决方案</div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 min-h-[80px] text-sm text-emerald-900 whitespace-pre-wrap">
                  {exc.resolution || <span className="text-slate-400">暂未记录</span>}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1.5">处理结果</div>
                <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 min-h-[80px] text-sm text-sky-900 whitespace-pre-wrap">
                  {exc.handlingResult || <span className="text-slate-400">暂未记录</span>}
                </div>
              </div>
            </div>
            {exc.resolutionDetail && (
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-1.5">处理详情</div>
                <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 overflow-x-auto">
                  {JSON.stringify(exc.resolutionDetail, null, 2)}
                </pre>
              </div>
            )}
          </Section>

          <Section title="SLA 与时间节点" icon={Clock}>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="创建时间" value={fmtDateTime(exc.createdAt)} />
              <Stat label="截止时间" value={exc.deadline ? fmtDateTime(exc.deadline) : '-'} warn={exc.deadline && !exc.closedAt && new Date(exc.deadline) < new Date()} />
              <Stat label="关闭时间" value={exc.closedAt ? fmtDateTime(exc.closedAt) : '-'} ok={!!exc.closedAt} />
            </div>
            {exc.createdAt && (exc.closedAt || exc.updatedAt) && (
              <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm flex items-center justify-between">
                <span className="text-slate-500">累计处理耗时</span>
                <span className="font-semibold text-slate-900">
                  {formatDuration(new Date(exc.closedAt || exc.updatedAt).getTime() - new Date(exc.createdAt).getTime())}
                </span>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, warn, ok }: { label: string; value: string; warn?: boolean; ok?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${warn ? 'bg-rose-50 border-rose-200' : ok ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`font-medium ${warn ? 'text-rose-700' : ok ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} 分钟`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h < 48) return `${h} 小时 ${m} 分`;
  const d = Math.floor(h / 24);
  return `${d} 天 ${h % 24} 小时`;
}
