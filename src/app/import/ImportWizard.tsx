'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SourceType, RiskLevel } from '@/lib/utils';
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
  FileText,
  Eye,
  AlertTriangle,
  FileUp,
} from 'lucide-react';
import { cn, RISK_LABEL } from '@/lib/utils';
import { previewParse, createAuditBatch } from '../actions/batches';
import type { ParsedPermissionLog, ParsedErpRecord, ParsedEmail } from '@/lib/parsers';

interface Props {
  onCreated?: (batchId: string) => void;
}

type Step = 1 | 2 | 3;

interface PreviewResult {
  ok: boolean;
  counts: { permission: number; erp: number; email: number; total: number };
  sourceType: SourceType;
  riskBreakdown: { HIGH: number; MEDIUM: number; LOW: number };
  preview: {
    permission: ParsedPermissionLog[];
    erp: ParsedErpRecord[];
    email: ParsedEmail[];
  };
}

const PERM_SAMPLE = `user_id,user_name,action,resource,ip_address,occurred_at
U001,陈伟,批量导出客户资料,/api/customer/export,10.10.1.25,2026-06-20 14:30:00
U002,李华,越权审批付款,FIN-PAY-*,10.10.2.33,2026-06-20 09:15:00
U003,刘洋,访问敏感定价文档,/confidential/pricing.xlsx,10.10.3.41,2026-06-19 16:45:00
U004,钱进,共享管理员账号登录,root@erp-node,10.10.1.12,2026-06-18 08:20:00`;

const ERP_SAMPLE = `document_no,document_type,amount,department,operator,approver,created_at
PAY-2026-08821,PAYMENT,5800000,采购部,李华,财务总监,2026-06-20
PO-2026-1123,PURCHASE,320000,市场部,陈伟,采购经理,2026-06-19
CT-2026-0045,CONTRACT,1250000,法务部,刘洋,CEO,2026-06-18`;

const EMAIL_SAMPLE = `From: audit-alert@company.com
To: management@company.com, reviewer@company.com
Subject: 【预警】批量导出敏感数据行为
Date: 2026-06-20 14:35:00

30 分钟内检测到批量导出 1.2 万条客户信息，操作人未走审批流程，IP 10.10.1.25。

---

From: legal-review@company.com
To: management@company.com
Subject: 【法务】合同评审未通过反馈
Date: 2026-06-19 17:20:00

合同 CT-2026-0045 未明确违约责任上限，建议退回业务部门重审。
`;

export function ImportWizardButton({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [sourceType, setSourceType] = useState<SourceType>('COMBINED');
  const [fileName, setFileName] = useState('合规审计导入_' + new Date().toISOString().slice(0, 10) + '.xlsx');
  const [permCsv, setPermCsv] = useState('');
  const [erpCsv, setErpCsv] = useState('');
  const [emlPkg, setEmlPkg] = useState('');
  const [running, setRunning] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);

  const permFileRef = useRef<HTMLInputElement>(null);
  const erpFileRef = useRef<HTMLInputElement>(null);
  const emlFileRef = useRef<HTMLInputElement>(null);

  const runPreview = useCallback(async () => {
    setPreviewing(true);
    setError(null);
    try {
      const r = await previewParse({
        sourceType,
        fileName,
        permissionCsv: permCsv,
        erpCsv,
        emailEmlPack: emlPkg,
      });
      setPreview(r as PreviewResult);
    } catch (e: any) {
      setError(e?.message || '预览失败');
    } finally {
      setPreviewing(false);
    }
  }, [sourceType, fileName, permCsv, erpCsv, emlPkg]);

  useEffect(() => {
    if (step === 2 && (permCsv || erpCsv || emlPkg)) {
      const t = setTimeout(() => runPreview(), 600);
      return () => clearTimeout(t);
    }
  }, [step, permCsv, erpCsv, emlPkg, runPreview]);

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setter(text);
    } catch (err: any) {
      setError(`读取文件失败：${err?.message}`);
    }
  }

  function insertSample(type: 'perm' | 'erp' | 'email') {
    if (type === 'perm') setPermCsv(PERM_SAMPLE);
    if (type === 'erp') setErpCsv(ERP_SAMPLE);
    if (type === 'email') setEmlPkg(EMAIL_SAMPLE);
  }

  async function confirm() {
    setRunning(true);
    setError(null);
    try {
      const r = await createAuditBatch({
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
    setPreview(null);
    setPermCsv('');
    setErpCsv('');
    setEmlPkg('');
  }

  const RiskBadge = ({ level }: { level: RiskLevel }) => (
    <span className={cn(
      'inline-block px-1.5 py-0.5 text-[10px] font-medium rounded',
      level === 'HIGH' ? 'bg-rose-100 text-rose-700' :
        level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
          'bg-emerald-100 text-emerald-700',
    )}>
      {RISK_LABEL[level]}
    </span>
  );

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
          <div className="card p-0 w-full max-w-5xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-base font-semibold text-slate-800">
                {step === 1 && 'Step 1 · 选择数据源类型'}
                {step === 2 && 'Step 2 · 上传原始文件 · 实时预览解析结果'}
                {step === 3 && 'Step 3 · 批次创建结果'}
              </h3>
              <button
                onClick={reset}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    {(sourceType === 'PERMISSION_LOG' || sourceType === 'COMBINED') && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="label text-[11px] m-0">Step 1 · 权限日志（CSV/TSV/TXT）</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => insertSample('perm')}
                              className="text-[10px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              插入示例
                            </button>
                            <input
                              ref={permFileRef}
                              type="file"
                              accept=".csv,.tsv,.txt"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setPermCsv)}
                            />
                            <button
                              type="button"
                              onClick={() => permFileRef.current?.click()}
                              className="text-[10px] px-2 py-1 rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center gap-1"
                            >
                              <FileUp className="w-3 h-3" /> 上传文件
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="input !h-auto font-mono text-xs resize-y"
                          rows={5}
                          placeholder="user_id,user_name,action,resource,ip...\nU001,陈伟,批量导出客户资料..."
                          value={permCsv}
                          onChange={(e) => setPermCsv(e.target.value)}
                        />
                      </div>
                    )}

                    {(sourceType === 'ERP_EXPORT' || sourceType === 'COMBINED') && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="label text-[11px] m-0">Step 2 · ERP 单据导出（CSV/TSV/TXT）</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => insertSample('erp')}
                              className="text-[10px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              插入示例
                            </button>
                            <input
                              ref={erpFileRef}
                              type="file"
                              accept=".csv,.tsv,.txt"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setErpCsv)}
                            />
                            <button
                              type="button"
                              onClick={() => erpFileRef.current?.click()}
                              className="text-[10px] px-2 py-1 rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center gap-1"
                            >
                              <FileUp className="w-3 h-3" /> 上传文件
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="input !h-auto font-mono text-xs resize-y"
                          rows={5}
                          placeholder="doc_no,type,amount,dept,operator,approver..."
                          value={erpCsv}
                          onChange={(e) => setErpCsv(e.target.value)}
                        />
                      </div>
                    )}

                    {(sourceType === 'EMAIL_MATERIAL' || sourceType === 'COMBINED') && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="label text-[11px] m-0">Step 3 · 邮件材料（EML/TXT）</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => insertSample('email')}
                              className="text-[10px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              插入示例
                            </button>
                            <input
                              ref={emlFileRef}
                              type="file"
                              accept=".eml,.txt"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, setEmlPkg)}
                            />
                            <button
                              type="button"
                              onClick={() => emlFileRef.current?.click()}
                              className="text-[10px] px-2 py-1 rounded-md bg-brand-50 text-brand-700 hover:bg-brand-100 flex items-center gap-1"
                            >
                              <FileUp className="w-3 h-3" /> 上传文件
                            </button>
                          </div>
                        </div>
                        <textarea
                          className="input !h-auto font-mono text-xs resize-y"
                          rows={5}
                          placeholder="From: ...\nTo: ...\nSubject: ...\n\n正文..."
                          value={emlPkg}
                          onChange={(e) => setEmlPkg(e.target.value)}
                        />
                      </div>
                    )}
                    {error && (
                      <div className="text-xs text-rose-600 bg-rose-50 ring-1 ring-rose-200 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                        <Eye className="w-4 h-4 text-brand-600" />
                        实时解析预览
                      </div>
                      {previewing && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                      <button
                        type="button"
                        onClick={runPreview}
                        className="text-[10px] px-2 py-1 rounded-md bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                      >
                        刷新预览
                      </button>
                    </div>

                    {!preview && !previewing && (
                      <div className="text-center py-8 text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">粘贴或上传内容后自动预览解析结果</p>
                      </div>
                    )}

                    {preview && (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-white rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-slate-800">{preview.counts.permission}</div>
                            <div className="text-[10px] text-slate-500">权限日志</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-slate-800">{preview.counts.erp}</div>
                            <div className="text-[10px] text-slate-500">ERP 单据</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-slate-800">{preview.counts.email}</div>
                            <div className="text-[10px] text-slate-500">邮件材料</div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-3 space-y-2">
                          <div className="font-medium text-slate-700">风险分布</div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span className="text-[11px] text-slate-600">高风险 <b className="text-rose-600">{preview.riskBreakdown.HIGH}</b></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-[11px] text-slate-600">中风险 <b className="text-amber-600">{preview.riskBreakdown.MEDIUM}</b></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[11px] text-slate-600">低风险 <b className="text-emerald-600">{preview.riskBreakdown.LOW}</b></span>
                            </div>
                          </div>
                        </div>

                        {preview.preview.permission.length > 0 && (
                          <div className="bg-white rounded-lg p-3">
                            <div className="font-medium text-slate-700 mb-2">权限日志预览（{preview.preview.permission.length}/{preview.counts.permission}）</div>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                              {preview.preview.permission.map((p, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] border-b border-slate-100 pb-1.5">
                                  <RiskBadge level={p.riskLevel} />
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate font-medium text-slate-700">{p.userName} · {p.action}</div>
                                    <div className="truncate text-slate-500">{p.resource}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {preview.preview.erp.length > 0 && (
                          <div className="bg-white rounded-lg p-3">
                            <div className="font-medium text-slate-700 mb-2">ERP 单据预览（{preview.preview.erp.length}/{preview.counts.erp}）</div>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                              {preview.preview.erp.map((e, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] border-b border-slate-100 pb-1.5">
                                  <RiskBadge level={e.riskLevel} />
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate font-medium text-slate-700">{e._title || e.documentType} · ¥{(e.amount ?? 0).toLocaleString()}</div>
                                    <div className="truncate text-slate-500">{e.documentNo} · {e.department}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {preview.preview.email.length > 0 && (
                          <div className="bg-white rounded-lg p-3">
                            <div className="font-medium text-slate-700 mb-2">邮件预览（{preview.preview.email.length}/{preview.counts.email}）</div>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                              {preview.preview.email.map((m, i) => (
                                <div key={i} className="flex items-start gap-2 text-[11px] border-b border-slate-100 pb-1.5">
                                  <RiskBadge level={m.riskLevel} />
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate font-medium text-slate-700">{m.subject}</div>
                                    <div className="truncate text-slate-500">{m.sender}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {preview.counts.total === 0 && (
                          <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-[11px] text-amber-800">
                              当前无解析到记录。留空将自动生成示例数据，用于验证三源合并→整改项写入流程。
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                  {result.counts && (
                    <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-emerald-700">
                      <span>权限日志 <b>{result.counts.permission}</b> 条</span>
                      <span>ERP <b>{result.counts.erp}</b> 条</span>
                      <span>邮件 <b>{result.counts.email}</b> 封</span>
                    </div>
                  )}
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

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
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
                      onCreated?.(result.batchId);
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
