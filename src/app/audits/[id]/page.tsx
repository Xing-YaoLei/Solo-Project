'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  CalendarClock,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  Paperclip,
  Save,
  Link2,
  Workflow,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/store/session';
import { mockData, type TimelineEvent } from '@/lib/mock-data';
import type { AuditItemLite } from '@/lib/mock-data';
import {
  RiskBadge,
  StatusBadge,
  SourceBadge,
} from '@/components/ui/Badges';
import {
  cn,
  formatDate,
  formatDateTime,
  formatNumber,
  STATUS_LABEL,
  RISK_LABEL,
} from '@/lib/utils';
import { getMockUserById } from '@/lib/auth';

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useSession();
  const router = useRouter();
  const [audit, setAudit] = useState<AuditItemLite | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [rectText, setRectText] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    const a = mockData.audits.get(params.id);
    setAudit(a);
    setTimeline(mockData.audits.timeline(params.id));
  }, [params.id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function onSubmitRectification() {
    if (!audit || !user) return;
    if (!rectText.trim()) {
      showToast('请填写整改说明');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const updated = mockData.audits.submitRectification(
        audit.id,
        user.id,
        rectText,
      );
      setAudit({ ...audit, status: updated?.status ?? audit.status });
      setTimeline(mockData.audits.timeline(audit.id));
      setRectText('');
      setSaving(false);
      showToast('整改材料已提交，待复核人员审核');
    }, 600);
  }

  function onReview(passed: boolean) {
    if (!audit || !user) return;
    if (!passed && !reviewText.trim()) {
      showToast('复核不通过必须填写注释说明');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const updated = mockData.audits.review(
        audit.id,
        user.id,
        passed,
        reviewText || (passed ? '复核通过' : '退回整改'),
      );
      if (updated) {
        setAudit({ ...audit, ...updated } as AuditItemLite);
        setTimeline(mockData.audits.timeline(audit.id));
      }
      setReviewText('');
      setSaving(false);
      showToast(passed ? '复核通过，整改项已关闭' : '已退回并写入复核注释');
    }, 600);
  }

  if (!audit) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 text-sm gap-3">
        <AlertTriangle className="w-10 h-10 opacity-50" />
        审计项不存在或无权限查看
        <Link href="/audits" className="btn-outline !py-1.5 !text-xs">
          <ArrowLeft className="w-3 h-3" />
          返回列表
        </Link>
      </div>
    );
  }

  const isExecutor = audit.assigneeId === user?.id;
  const isReviewer = audit.reviewerId === user?.id || user?.role === 'REVIEWER';
  const canSubmitRect =
    isExecutor &&
    (audit.status === 'ASSIGNED' ||
      audit.status === 'IN_PROGRESS' ||
      audit.status === 'REJECTED');
  const canReview =
    (isReviewer || user?.role === 'MANAGEMENT') && audit.status === 'PENDING_REVIEW';

  const assigneeName = audit.assigneeId
    ? getMockUserById(audit.assigneeId)?.name ?? '指派中'
    : '未指派';
  const reviewerName = audit.reviewerId
    ? getMockUserById(audit.reviewerId)?.name ?? '指派中'
    : '未指派';

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-slate-900/95 text-white px-4 py-2.5 text-sm shadow-lg animate-slide-up flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Link
          href={user?.role === 'EXECUTOR' ? '/my-tasks' : '/audits'}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回
        </Link>
        <div className="flex items-center gap-2">
          <RiskBadge level={audit.riskLevel} />
          <StatusBadge status={audit.status} />
          <SourceBadge type={audit.sourceType} />
        </div>
      </div>

      <section className="card p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 min-w-0">
            <div className="text-xs text-slate-400 font-mono mb-2">
              ID · {audit.id.slice(0, 14)}
            </div>
            <h2 className="text-xl font-semibold text-slate-900 leading-snug">
              {audit.title}
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              {audit.description}
            </p>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCell
                icon={<Workflow className="w-3.5 h-3.5" />}
                label="派工规则"
                value={audit.dispatchRule}
              />
              <InfoCell
                icon={<CalendarClock className="w-3.5 h-3.5" />}
                label="处理时限"
                value={formatDate(audit.deadlineAt)}
                sub={`${
                  Math.ceil((+new Date(audit.deadlineAt) - Date.now()) / 86400000) > 0
                    ? '剩余 ' +
                      Math.ceil(
                        (+new Date(audit.deadlineAt) - Date.now()) / 86400000,
                      ) +
                      ' 天'
                    : audit.status === 'CLOSED'
                      ? '已关闭'
                      : '已逾期'
                }`}
                danger={
                  audit.status !== 'CLOSED' &&
                  +new Date(audit.deadlineAt) < Date.now()
                }
              />
              <InfoCell
                icon={<User className="w-3.5 h-3.5" />}
                label="整改执行人"
                value={assigneeName}
              />
              <InfoCell
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                label="复核人"
                value={reviewerName}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>来源批次：</span>
                <Link
                  href={`/import/${audit.batchId}`}
                  className="font-mono text-brand-700 hover:underline"
                >
                  {audit.batchNo}
                </Link>
              </div>
              <div>创建：{formatDateTime(audit.createdAt)}</div>
              {audit.closedAt && <div>关闭：{formatDateTime(audit.closedAt)}</div>}
              {audit.closeReason && (
                <div className="chip bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  关闭原因：{audit.closeReason}
                </div>
              )}
              {audit.revisionCount > 0 && (
                <div className="chip bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
                  被退回 {audit.revisionCount} 次
                </div>
              )}
              {audit.firstTimePass !== null && (
                <div
                  className={cn(
                    'chip',
                    audit.firstTimePass
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                      : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
                  )}
                >
                  {audit.firstTimePass ? '首次解决' : '多次整改'}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {canSubmitRect && (
              <div className="rounded-xl border border-brand-500/30 bg-brand-50/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
                  <Upload className="w-4 h-4" />
                  提交整改材料
                </div>
                <p className="mt-1 text-[11px] text-brand-700/80">
                  请描述整改动作并上传佐证材料，提交后等待复核。
                </p>
                <textarea
                  className="input mt-3 min-h-[96px] text-sm"
                  placeholder="例如：已调整用户权限、补充审批单据、完成系统配置变更..."
                  value={rectText}
                  onChange={(e) => setRectText(e.target.value)}
                />
                <div className="mt-2 flex items-center justify-between">
                  <button className="btn-outline !px-3 !py-1.5 text-xs">
                    <Paperclip className="w-3 h-3" />
                    上传附件
                  </button>
                  <button
                    disabled={saving}
                    onClick={onSubmitRectification}
                    className="btn-primary !px-4 !py-1.5 text-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? '提交中...' : '提交整改'}
                  </button>
                </div>
              </div>
            )}

            {canReview && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-50/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                  <MessageSquare className="w-4 h-4" />
                  复核与注释
                </div>
                <p className="mt-1 text-[11px] text-rose-700/80">
                  复核不通过必须填写注释说明，用于审计回查。
                </p>
                <textarea
                  className="input mt-3 min-h-[84px] text-sm"
                  placeholder="复核意见（不通过时必填）：如整改材料不完整，缺少第三方签字页..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    disabled={saving}
                    onClick={() => onReview(false)}
                    className="btn-danger !px-4 !py-1.5 text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    不通过 · 写注释退回
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => onReview(true)}
                    className="btn-success !px-4 !py-1.5 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    复核通过 · 关闭
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200/70 bg-white p-4">
              <div className="text-xs font-medium text-slate-500">流转状态</div>
              <ol className="mt-3 space-y-3">
                {(
                  [
                    ['CREATED', '创建'],
                    ['ASSIGNED', '派工'],
                    ['IN_PROGRESS', '整改中'],
                    ['PENDING_REVIEW', '待复核'],
                    ['CLOSED', '已关闭'],
                  ] as const
                ).map(([k, label], i, arr) => {
                  const curIdx = arr.findIndex((x) => x[0] === audit.status);
                  const myIdx = i;
                  const active =
                    (audit.status === 'REJECTED' && myIdx <= 3) || myIdx <= curIdx;
                  return (
                    <li key={k} className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold shrink-0',
                          active
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span
                          className={cn(
                            'text-sm',
                            active ? 'text-slate-800 font-medium' : 'text-slate-400',
                          )}
                        >
                          {label}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono',
                            active ? 'text-slate-500' : 'text-slate-300',
                          )}
                        >
                          {STATUS_LABEL[k]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand-600" />
              整改时间线
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              所有操作均有记录，可用于合规回查
            </p>
          </div>
          <div className="text-xs text-slate-400">
            共 <span className="font-mono font-semibold text-slate-600">{formatNumber(timeline.length)}</span> 条事件
          </div>
        </div>

        <ol className="relative border-l border-slate-200 ml-3 space-y-6 pb-2">
          {[...timeline].reverse().map((ev) => {
            const meta = EventMeta[ev.type];
            return (
              <li key={ev.id} className="ml-6 relative">
                <span
                  className={cn(
                    'absolute -left-[30px] w-6 h-6 rounded-full ring-4 ring-white flex items-center justify-center',
                    meta.dotBg,
                  )}
                >
                  <span className={cn('w-2.5 h-2.5 rounded-full', meta.dotCore)} />
                </span>
                <div className="rounded-xl border border-slate-200/70 p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center',
                          meta.iconWrap,
                        )}
                      >
                        <span className={cn('w-3.5 h-3.5', meta.iconClass)}>
                          {meta.icon}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {meta.label}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <User className="w-3 h-3" />
                          {ev.actorName}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0">
                      {formatDateTime(ev.createdAt)}
                    </div>
                  </div>
                  {ev.comment && (
                    <div
                      className={cn(
                        'mt-3 p-3 rounded-lg text-sm leading-relaxed',
                        ev.type === 'REVIEW_FAIL'
                          ? 'bg-rose-50 text-rose-900 ring-1 ring-rose-100'
                          : ev.type === 'REVIEW_PASS' || ev.type === 'CLOSE'
                            ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100'
                            : 'bg-slate-50 text-slate-700 ring-1 ring-slate-100',
                      )}
                    >
                      {ev.comment}
                    </div>
                  )}
                  {ev.attachments?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {ev.attachments.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white ring-1 ring-slate-200 text-xs text-slate-600"
                        >
                          <Paperclip className="w-3 h-3 text-slate-400" />
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function InfoCell({
  icon,
  label,
  value,
  sub,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <div
        className={cn(
          'text-sm font-medium mt-0.5',
          danger ? 'text-red-600' : 'text-slate-800',
        )}
      >
        {value}
      </div>
      {sub && (
        <div
          className={cn(
            'text-[11px] mt-0.5',
            danger ? 'text-red-500' : 'text-slate-400',
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

const EventMeta: Record<
  TimelineEvent['type'],
  {
    label: string;
    icon: React.ReactNode;
    iconWrap: string;
    iconClass: string;
    dotBg: string;
    dotCore: string;
  }
> = {
  CREATE: {
    label: '创建整改项',
    icon: <ShieldCheck />,
    iconWrap: 'bg-slate-100 text-slate-600',
    iconClass: 'text-slate-600',
    dotBg: 'bg-slate-200',
    dotCore: 'bg-slate-500',
  },
  ASSIGN: {
    label: '派工分配',
    icon: <Workflow />,
    iconWrap: 'bg-indigo-50 text-indigo-600',
    iconClass: 'text-indigo-600',
    dotBg: 'bg-indigo-200',
    dotCore: 'bg-indigo-500',
  },
  RECTIFY: {
    label: '提交整改',
    icon: <Upload />,
    iconWrap: 'bg-brand-50 text-brand-700',
    iconClass: 'text-brand-700',
    dotBg: 'bg-brand-200',
    dotCore: 'bg-brand-600',
  },
  REVIEW_PASS: {
    label: '复核通过',
    icon: <CheckCircle2 />,
    iconWrap: 'bg-emerald-50 text-emerald-600',
    iconClass: 'text-emerald-600',
    dotBg: 'bg-emerald-200',
    dotCore: 'bg-emerald-500',
  },
  REVIEW_FAIL: {
    label: '复核退回',
    icon: <AlertTriangle />,
    iconWrap: 'bg-amber-50 text-amber-600',
    iconClass: 'text-amber-600',
    dotBg: 'bg-amber-200',
    dotCore: 'bg-amber-500',
  },
  CLOSE: {
    label: '整改关闭',
    icon: <FileCheck2 />,
    iconWrap: 'bg-emerald-50 text-emerald-700',
    iconClass: 'text-emerald-700',
    dotBg: 'bg-emerald-300',
    dotCore: 'bg-emerald-600',
  },
};
