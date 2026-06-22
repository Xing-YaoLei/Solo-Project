'use client';

import { useState } from 'react';
import type { SourceType } from '@/lib/utils';
import {
  Plus,
  Loader2,
  Database,
  Sheet,
  Mail,
  Upload,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onCreate: (input: any) => Promise<{ ok: boolean; batchId?: string; batchNo?: string; auditCount?: number; log?: any[]; error?: string }>;
}

type Step = 1 | 2 | 3;

export function ImportWizardButton({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [sourceType, setSourceType] = useState<SourceType>('COMBINED');
  const [fileName, setFileName] = useState('合规审计导入_' + new Date().toISOString().slice(0, 10) + '.xlsx');
  const [permCsv, setPermCsv] = useState('');
  const [erpCsv, setErpCsv] = useState('');
  const [emlPkg, setEmlPkg] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setRunning(true);
    setError(null);
    try {
      const r = await onCreate({
        sourceType,
        fileName,
        permissionCsv: permCsv,
        erpCsv,
        emailEmlPack: emlPkg,
      });
      if (!r.ok) {
        setError((r as any).error || '创建失败');
      } else {
        setResult(r);
        setStep(3);
      }
    } catch (e: any) {
      setError(e?.message || '未知错误');
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setOpen(false);
    setStep(1);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary"
      >
        <Plus className="w-4 h-4" />
        新建导入批次
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="card p-0 w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">
                {step === 1 && 'Step 1 · 选择数据源类型'}
                {step === 2 && 'Step 2 · 上传原始文件（或粘贴示例内容）'}
                {step === 3 && 'Step 3 · 批次创建结果'}
              </h3>
              <button
                onClick={reset}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { v: 'PERMISSION_LOG', label: '仅权限日志', icon: Database, desc: '权限异常行为基线扫描' },
                      { v: 'ERP_EXPORT', label: '仅 ERP 导出', icon: Sheet, desc: '采购/付款/合同单据' },
                      { v: 'EMAIL_MATERIAL', label: '仅邮件材料', icon: Mail, desc: '法务/审计/举报佐证' },
                      { v: 'COMBINED', label: '三源合并', icon: Upload, desc: '权限+ERP+邮件 全链路（推荐）' },
                    ] as const).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setSourceType(o.v)}
                        className={cn(
                          'text-left rounded-xl p-4 border-2 transition',
                          sourceType === o.v
                            ? 'border-brand-500 bg-brand-50/40'
                            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <o.icon className={cn('w-4 h-4', sourceType === o.v ? 'text-brand-600' : 'text-slate-500')} />
                          <div className="text-sm font-medium text-slate-800">{o.label}</div>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{o.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="label">批次文件名 / 描述</label>
                    <input
                      className="input"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="如：合规审计导入_2026Q2_第4批"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  {(sourceType === 'PERMISSION_LOG' || sourceType === 'COMBINED') && (
                    <Field label="Step 1 · 权限日志 CSV（每行一条行为记录，留空使用示例）">
                      <textarea
                        className="input !h-auto font-mono text-xs resize-y"
                        rows={3}
                        placeholder="user,action,resource,ip..."
                        value={permCsv}
                        onChange={(e) => setPermCsv(e.target.value)}
                      />
                    </Field>
                  )}
                  {(sourceType === 'ERP_EXPORT' || sourceType === 'COMBINED') && (
                    <Field label="Step 2 · ERP 单据导出（每行一条单据）">
                      <textarea
                        className="input !h-auto font-mono text-xs resize-y"
                        rows={3}
                        placeholder="docNo,amount,dept,operator,approver..."
                        value={erpCsv}
                        onChange={(e) => setErpCsv(e.target.value)}
                      />
                    </Field>
                  )}
                  {(sourceType === 'EMAIL_MATERIAL' || sourceType === 'COMBINED') && (
                    <Field label="Step 3 · 邮件材料（每段一封）">
                      <textarea
                        className="input !h-auto font-mono text-xs resize-y"
                        rows={3}
                        placeholder="From: ... To: ... Subject: ..."
                        value={emlPkg}
                        onChange={(e) => setEmlPkg(e.target.value)}
                      />
                    </Field>
                  )}
                  <p className="text-[11px] text-slate-400">
                    💡 演示模式：所有字段留空将自动生成示例数据，用于快速验证三源合并→整改项写入流程
                  </p>
                  {error && (
                    <div className="text-xs text-rose-600 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">
                      {error}
                    </div>
                  )}
                </>
              )}

              {step === 3 && result && (
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-5 text-center">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-300">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-emerald-900">批次创建成功！</h4>
                  <div className="mt-2 text-sm text-emerald-800">
                    批次号 <span className="font-mono font-semibold">{result.batchNo}</span> · 生成{' '}
                    <span className="font-semibold">{result.auditCount}</span> 条整改项并完成自动派工
                  </div>
                  {result.log && (
                    <div className="mt-4 text-left text-[11px] font-mono bg-slate-900 rounded-xl p-3 text-slate-200 space-y-1 max-h-40 overflow-auto">
                      {result.log.map((l: any, i: number) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-slate-500">{l.t.slice(11, 19)}</span>
                          <span className={l.step === 'OK' ? 'text-emerald-400' : 'text-sky-400'}>[{l.step}]</span>
                          <span>{l.msg}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => (step > 1 ? setStep((s) => (s - 1) as Step) : reset())}
                className="btn-secondary text-xs py-2 px-3"
              >
                {step > 1 ? '上一步' : '取消'}
              </button>
              <div className="flex items-center gap-2">
                {step < 3 && (
                  <button
                    onClick={() => (step === 2 ? confirm() : setStep((s) => (s + 1) as Step))}
                    disabled={running}
                    className={cn('btn-primary text-xs py-2 px-4', running && 'opacity-60 pointer-events-none')}
                  >
                    {running && <Loader2 className="w-4 h-4 animate-spin" />}
                    {step === 2 ? (running ? '正在写入 Prisma...' : '确认创建并写入数据库') : '下一步'}
                    {!running && step === 1 && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={() => {
                      window.location.href = `/import/${result.batchId}`;
                    }}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    前往批次回查页 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label text-[11px]">{label}</label>
      {children}
    </div>
  );
}
