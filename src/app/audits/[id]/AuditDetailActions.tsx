'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AuditStatus, UserRole } from '@/lib/utils';
import { Send, Check, X, Paperclip, ShieldCheck, Loader } from 'lucide-react';

interface Props {
  userRole: UserRole;
  auditId: string;
  initialStatus: AuditStatus;
  submitRect: (auditId: string, desc: string, files?: string[]) => Promise<{ ok: boolean }>;
  submitRev: (auditId: string, passed: boolean, comment: string) => Promise<{ ok: boolean }>;
}

export function AuditDetailActions({ userRole, auditId, initialStatus, submitRect, submitRev }: Props) {
  const canRect = userRole === 'EXECUTOR' && ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'].includes(initialStatus);
  const canRev = (userRole === 'REVIEWER' || userRole === 'MANAGEMENT') && initialStatus === 'PENDING_REVIEW';

  if (!canRect && !canRev) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {canRect && (
        <RectPanel auditId={auditId} onSubmit={submitRect} />
      )}
      {canRev && (
        <ReviewPanel auditId={auditId} onSubmit={submitRev} />
      )}
    </div>
  );
}

function RectPanel({
  auditId,
  onSubmit,
}: {
  auditId: string;
  onSubmit: (auditId: string, desc: string, files?: string[]) => Promise<{ ok: boolean }>;
}) {
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <form
      action={async () => {
        if (!desc.trim()) return;
        setLoading(true);
        try {
          const r = await onSubmit(auditId, desc, files);
          setOk(r.ok);
          if (r.ok) setTimeout(() => location.reload(), 600);
        } finally {
          setLoading(false);
        }
      }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Send className="w-4 h-4 text-brand-600" />
          提交整改结果
        </h3>
        {ok && <span className="text-xs text-emerald-600">✓ 已提交，等待复核</span>}
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={5}
        placeholder="请详细描述整改动作、已落实的控制措施、可验证的证据链接..."
        className="input mt-3 !h-auto resize-none text-sm"
        required
      />
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary text-xs py-2 px-3"
          onClick={() => setFiles((s) => [...s, `附件-${s.length + 1}.pdf`])}
        >
          <Paperclip className="w-3.5 h-3.5" />
          添加佐证附件
        </button>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {files.map((f, i) => (
              <span key={i} className="chip bg-sky-50 text-sky-700 ring-1 ring-sky-200">
                {f}
                <button
                  type="button"
                  className="ml-1 text-sky-500 hover:text-sky-700"
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !desc.trim()}
        className={cn('btn-primary mt-4', (loading || !desc.trim()) && 'opacity-60 pointer-events-none')}
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        提交整改并进入复核
      </button>
    </form>
  );
}

function ReviewPanel({
  auditId,
  onSubmit,
}: {
  auditId: string;
  onSubmit: (auditId: string, passed: boolean, comment: string) => Promise<{ ok: boolean }>;
}) {
  const [passed, setPassed] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      action={async () => {
        if (passed === null) return;
        if (!passed && !comment.trim()) {
          setErr('复核不通过必须填写意见，说明退回原因');
          return;
        }
        setErr(null);
        setLoading(true);
        try {
          const r = await onSubmit(auditId, passed, comment);
          if (r.ok) setTimeout(() => location.reload(), 600);
        } finally {
          setLoading(false);
        }
      }}
      className="card p-5"
    >
      <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-600" />
        复核整改结果
      </h3>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setPassed(true);
            setComment(comment || '复核通过，整改有效');
          }}
          className={cn(
            'rounded-xl px-4 py-3 text-left transition border-2',
            passed === true
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30',
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-700">复核通过</div>
              <div className="text-[11px] text-emerald-600/80">整改闭环、关闭该事项</div>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setPassed(false)}
          className={cn(
            'rounded-xl px-4 py-3 text-left transition border-2',
            passed === false
              ? 'border-rose-500 bg-rose-50'
              : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/30',
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <X className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-rose-700">复核不通过</div>
              <div className="text-[11px] text-rose-600/80">退回整改，必须写清意见</div>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-slate-500">
            复核意见 {passed === false && <span className="text-rose-600 ml-0.5">（必填）</span>}
          </label>
          <div className="text-[11px] text-slate-400 font-mono">{comment.length}/500</div>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          rows={4}
          placeholder={passed === false ? '请具体说明退回原因、需要补充的材料或需要整改的动作...' : '可选，填写复核意见后归档'}
          className="input !h-auto resize-none text-sm"
        />
        {err && (
          <div className="mt-2 text-xs text-rose-600 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || passed === null}
        className={cn('btn-primary mt-4', (loading || passed === null) && 'opacity-60 pointer-events-none')}
      >
        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        提交复核结论
      </button>
    </form>
  );
}
