import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuditDetail, submitRectification, submitReview } from '@/app/actions/audits';
import { RiskBadge, StatusBadge, SourceBadge } from '@/components/ui/Badges';
import { cn, formatDateTime, SOURCE_LABEL, STATUS_LABEL, STEP_INDEX } from '@/lib/utils';
import type { AuditStatus } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  ShieldCheck,
  FileWarning,
  Check,
  X,
  Clock,
  Paperclip,
} from 'lucide-react';
import { AuditDetailActions } from './AuditDetailActions';

export default async function AuditDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user, audit, forbidden } = await getAuditDetail(params.id);

  if (!audit) redirect(user.role === 'EXECUTOR' ? '/my-tasks' : '/audits');

  const steps: AuditStatus[] = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_REVIEW', 'CLOSED'];
  const stepIdx =
    audit.status === 'REJECTED' ? STEP_INDEX['IN_PROGRESS'] : STEP_INDEX[audit.status as AuditStatus] ?? 0;

  if (forbidden) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="card p-10 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center ring-1 ring-rose-200">
            <FileWarning className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">越权访问被拦截</h2>
          <p className="mt-2 text-sm text-slate-500">
            您是 <span className="font-medium text-slate-700">{user.name}</span>（执行角色），仅可查看分配给您的整改项。
            该整改项负责人为 <span className="font-medium text-slate-700">{audit.assignee?.name || '未分配'}</span>。
          </p>
          <Link
            href="/my-tasks"
            className="btn-primary inline-flex mt-6"
          >
            返回我的整改
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const timeline: Array<{
    t: Date;
    user: string;
    kind: 'create' | 'assign' | 'submit' | 'review-pass' | 'review-fail' | 'close';
    desc: string;
  }> = [];
  timeline.push({ t: new Date(audit.createdAt), user: audit.batch.createdById || '系统', kind: 'create', desc: `从批次 ${audit.batch.batchNo} 生成整改项` });
  if (audit.assignee && audit.status !== 'CREATED') {
    timeline.push({ t: new Date(audit.createdAt), user: '管理层派工', kind: 'assign', desc: `分派给 ${audit.assignee.name}（${audit.dispatchRule}）` });
  }
  for (const r of [...audit.rectifications].reverse()) {
    timeline.push({ t: new Date(r.createdAt), user: r.submitterId, kind: 'submit', desc: r.description });
  }
  for (const rv of audit.reviews) {
    timeline.push({
      t: new Date(rv.createdAt),
      user: rv.reviewerId,
      kind: rv.passed ? 'review-pass' : 'review-fail',
      desc: rv.comment || (rv.passed ? '复核通过' : '复核退回'),
    });
  }
  if (audit.status === 'CLOSED') {
    timeline.push({
      t: new Date(audit.closedAt || new Date()),
      user: audit.reviewer?.name || '系统',
      kind: 'close',
      desc: `关闭，原因：${audit.closeReason || '已完成整改'}`,
    });
  }
  timeline.sort((a, b) => a.t.getTime() - b.t.getTime());

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Link
          href={user.role === 'EXECUTOR' ? '/my-tasks' : '/audits'}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回列表
        </Link>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <RiskBadge level={audit.riskLevel as any} />
              <StatusBadge status={audit.status as any} />
              <SourceBadge type={(audit.sourceType || audit.batch.sourceType) as any} />
              {audit.revisionCount > 0 && (
                <span className="chip bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  已退回 {audit.revisionCount} 次
                </span>
              )}
            </div>
            <h1 className="mt-3 text-xl font-semibold text-slate-900">{audit.title}</h1>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{audit.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs min-w-[340px]">
            <Info label="批次编号" value={
              <Link href={`/import/${audit.batch.id}`} className="text-brand-600 font-mono hover:underline">
                {audit.batch.batchNo}
              </Link>
            } />
            <Info label="来源类型" value={SOURCE_LABEL[audit.sourceType as keyof typeof SOURCE_LABEL] || audit.batch.sourceType} />
            <Info label="派工规则" value={audit.dispatchRule} />
            <Info label="处理期限" value={`${formatDateTime(new Date(audit.deadlineAt)).slice(0, 16)}`} />
            <Info label="执行人" value={audit.assignee?.name || '未分配'} />
            <Info label="复核人" value={audit.reviewer?.name || '待指派'} />
          </div>
        </div>

        <div className="mt-6">
          <ol className="relative grid grid-cols-5 gap-2">
            {steps.map((s, i) => {
              const done = i <= stepIdx;
              const rejected = audit.status === 'REJECTED' && i === 2;
              return (
                <li key={s} className="text-center relative">
                  <div
                    className={cn(
                      'mx-auto w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold relative z-10 ring-4 ring-white',
                      done
                        ? rejected
                          ? 'bg-rose-500 text-white'
                          : 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-400',
                    )}
                  >
                    {done && !rejected ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2',
                        i < stepIdx ? 'bg-brand-500' : 'bg-slate-200',
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'mt-2 text-[11px]',
                      done ? 'text-slate-700 font-medium' : 'text-slate-400',
                    )}
                  >
                    {STATUS_LABEL[s as AuditStatus]}
                  </div>
                  {rejected && (
                    <div className="mt-0.5 text-[10px] text-rose-600">退回整改</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <AuditDetailActions userRole={user.role as any} auditId={audit.id} initialStatus={audit.status as any} submitRect={submitRectification} submitRev={submitReview} />

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          流转时间线
        </h3>
        <ol className="mt-4 space-y-4 relative border-l border-slate-200 ml-3">
          {timeline.map((e, i) => (
            <li key={i} className="ml-5">
              <div
                className={cn(
                  'absolute -left-[7px] mt-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white',
                  {
                    create: 'bg-slate-400',
                    assign: 'bg-brand-500',
                    submit: 'bg-sky-500',
                    'review-pass': 'bg-emerald-500',
                    'review-fail': 'bg-rose-500',
                    close: 'bg-slate-700',
                  }[e.kind],
                )}
              />
              <div className="p-3 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="text-slate-500">
                    <span className="font-medium text-slate-800">{e.user}</span> ·{' '}
                    {
                      {
                        create: '创建',
                        assign: '派工',
                        submit: '提交整改',
                        'review-pass': '复核通过',
                        'review-fail': '复核不通过',
                        close: '关闭',
                      }[e.kind]
                    }
                  </div>
                  <div className="text-slate-400 font-mono">{formatDateTime(e.t).slice(0, 16)}</div>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed">{e.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
      <div className="text-slate-700">{value}</div>
    </div>
  );
}
