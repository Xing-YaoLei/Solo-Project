'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Upload,
  Search,
  Plus,
  Database,
  Sheet,
  Mail,
  Layers,
  ChevronDown,
  ChevronRight,
  FileSearch,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader,
  Clock,
  ArrowUpDown,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/store/session';
import { mockData, type ImportBatchLite } from '@/lib/mock-data';
import { SourceBadge, BatchStatusBadge } from '@/components/ui/Badges';
import {
  cn,
  formatDateTime,
  formatNumber,
  SOURCE_LABEL,
} from '@/lib/utils';
import type { SourceType } from '@/lib/utils';

const SOURCE_META: Record<
  SourceType,
  { icon: React.ReactNode; color: string; desc: string; hint: string }
> = {
  PERMISSION_LOG: {
    icon: <Database className="w-4 h-4" />,
    color: 'from-blue-500 to-blue-700',
    desc: '第一步：加工权限日志',
    hint: '支持 CSV / JSON，列建议：userId, action, resource, ip, happenedAt',
  },
  ERP_EXPORT: {
    icon: <Sheet className="w-4 h-4" />,
    color: 'from-teal-500 to-teal-700',
    desc: '第二步：合并 ERP 导出',
    hint: 'Excel / CSV，列建议：documentNo, amount, department, happenedAt',
  },
  EMAIL_MATERIAL: {
    icon: <Mail className="w-4 h-4" />,
    color: 'from-fuchsia-500 to-fuchsia-700',
    desc: '第三步：汇入邮件材料',
    hint: 'ZIP / EML / PST 索引，列建议：subject, sender, recipients, sentAt',
  },
  COMBINED: {
    icon: <Layers className="w-4 h-4" />,
    color: 'from-slate-600 to-slate-800',
    desc: '多源合并批次',
    hint: '在批次级关联多源数据，便于整体回查',
  },
};

export default function ImportCenterPage() {
  const { user } = useSession();
  const [batches, setBatches] = useState<ImportBatchLite[]>([]);
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedSource, setSelectedSource] = useState<SourceType>('PERMISSION_LOG');
  const [fileName, setFileName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    setBatches(mockData.batches.list());
  }, []);

  const filtered = useMemo(() => {
    const arr = batches.filter(
      (b) =>
        !search ||
        b.batchNo.toLowerCase().includes(search.toLowerCase()) ||
        (b.fileName ?? '').toLowerCase().includes(search.toLowerCase()) ||
        SOURCE_LABEL[b.sourceType as SourceType]
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
    return arr.sort((a, b) =>
      sortDesc
        ? +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(a.createdAt) - +new Date(b.createdAt),
    );
  }, [batches, search, sortDesc]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  function onCreateBatch() {
    if (!user) return;
    if (!fileName) return;
    setProcessing(true);
    setTimeout(() => {
      const nb = mockData.batches.create({
        sourceType: selectedSource,
        fileName,
        createdById: user.id,
        createdByName: user.name,
      });
      setBatches(mockData.batches.list());
      setTimeout(() => {
        setBatches(mockData.batches.list());
      }, 1400);
      setProcessing(false);
      setShowWizard(false);
      setWizardStep(0);
      setFileName('');
      setExpandedId(nb.id);
    }, 700);
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              指标加工流水线
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              先处理权限日志，再合并 ERP 导出与邮件材料，全部以批次为单位回查
            </p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="btn-primary"
            disabled={user?.role !== 'MANAGEMENT'}
            title={user?.role !== 'MANAGEMENT' ? '仅管理层可导入' : ''}
          >
            <Plus className="w-4 h-4" />
            新建导入批次
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['PERMISSION_LOG', 'ERP_EXPORT', 'EMAIL_MATERIAL'] as SourceType[]).map(
            (s, i) => {
              const meta = SOURCE_META[s];
              const count = batches.filter((b) => b.sourceType === s).length;
              const totalRecords = batches
                .filter((b) => b.sourceType === s)
                .reduce((sum, b) => sum + b.recordCount, 0);
              return (
                <div
                  key={s}
                  className="relative rounded-xl border border-slate-200/70 p-4 bg-white overflow-hidden"
                >
                  <div
                    className={cn(
                      'absolute right-0 top-0 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 blur-2xl -mr-10 -mt-10',
                      meta.color,
                    )}
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg text-white flex items-center justify-center bg-gradient-to-br shadow-sm',
                        meta.color,
                      )}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">第 {i + 1} 步</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {SOURCE_LABEL[s]}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500">{meta.desc}</div>
                  <div className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                    {meta.hint}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500">
                      批次 <span className="font-mono font-semibold text-slate-700">{count}</span> ·
                      记录{' '}
                      <span className="font-mono font-semibold text-slate-700">
                        {formatNumber(totalRecords)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSource(s);
                        setShowWizard(true);
                      }}
                      className="text-brand-700 hover:text-brand-600 font-medium inline-flex items-center gap-1"
                    >
                      导入
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-brand-600" />
              导入批次（可回查）
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              点击批次号或展开行查看原始数据与生成的整改项
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索批次号 / 文件名 / 数据源"
                className="input !pl-9 !py-1.5 text-xs w-72"
              />
            </div>
            <button
              onClick={() => setSortDesc((v) => !v)}
              className="btn-outline !px-3 !py-1.5 text-xs"
              title="按时间排序"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortDesc ? '新→旧' : '旧→新'}
            </button>
            <button
              onClick={() => setBatches(mockData.batches.list())}
              className="btn-outline !px-3 !py-1.5 text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              刷新
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm min-w-[920px]">
            <thead className="bg-slate-50/60 border-y border-slate-100">
              <tr>
                <th className="th w-6 pl-6"></th>
                <th className="th w-44">批次号</th>
                <th className="th w-28">数据源</th>
                <th className="th w-56">文件</th>
                <th className="th w-36">导入人</th>
                <th className="th w-28">原始记录</th>
                <th className="th w-28">整改项</th>
                <th className="th w-28">状态</th>
                <th className="th w-44">导入时间</th>
                <th className="th w-24 text-right pr-6">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const expanded = expandedId === b.id;
                return (
                  <>
                    <tr
                      key={b.id}
                      className={cn(
                        'group hover:bg-brand-50/30 transition',
                        expanded && 'bg-brand-50/40',
                      )}
                    >
                      <td className="td pl-6">
                        <button
                          onClick={() => setExpandedId(expanded ? null : b.id)}
                          className="w-6 h-6 rounded-md hover:bg-white text-slate-400 hover:text-brand-700 ring-1 ring-slate-200 flex items-center justify-center"
                        >
                          {expanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="td">
                        <Link
                          href={`/import/${b.id}`}
                          className="font-mono text-brand-700 hover:underline font-medium"
                        >
                          {b.batchNo}
                        </Link>
                      </td>
                      <td className="td">
                        <SourceBadge type={b.sourceType as SourceType} />
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{b.fileName ?? '—'}</span>
                        </div>
                      </td>
                      <td className="td text-slate-600">{b.createdByName}</td>
                      <td className="td font-mono text-slate-700">
                        {formatNumber(b.recordCount)}
                      </td>
                      <td className="td font-mono text-slate-700">
                        {formatNumber(b.auditItemCount)}
                      </td>
                      <td className="td">
                        <span className="inline-flex items-center gap-1.5">
                          <BatchStatusBadge status={b.status as any} />
                          {b.status === 'PROCESSING' && (
                            <Loader className="w-3 h-3 text-amber-500 animate-spin" />
                          )}
                        </span>
                      </td>
                      <td className="td text-xs text-slate-500">
                        {formatDateTime(b.createdAt)}
                      </td>
                      <td className="td text-right pr-6">
                        <div className="inline-flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                          <Link
                            href={`/import/${b.id}`}
                            className="btn-ghost !px-2 !py-1 text-[11px]"
                          >
                            回查
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={b.id + '-exp'}>
                        <td colSpan={10} className="!border-t-0 bg-slate-50/60 px-6 pb-5 pt-0">
                          <ExpandedRow batchId={b.id} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showWizard && (
        <ImportWizard
          step={wizardStep}
          setStep={setWizardStep}
          selectedSource={selectedSource}
          setSelectedSource={setSelectedSource}
          fileName={fileName}
          onFile={onFile}
          processing={processing}
          onCancel={() => {
            setShowWizard(false);
            setWizardStep(0);
          }}
          onConfirm={onCreateBatch}
        />
      )}
    </div>
  );
}

function ExpandedRow({ batchId }: { batchId: string }) {
  const detail = mockData.batches.get(batchId);
  if (!detail) return null;
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-inner">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white ring-1 ring-slate-200 p-3">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            权限日志样本（{formatNumber(detail.permLogs.length)}）
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto text-[11px] font-mono text-slate-600">
            {detail.permLogs.slice(0, 6).map((l, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-50"
              >
                <span className="text-slate-400 w-14 shrink-0">{l.happenedAt.slice(5, 16).replace('T', ' ')}</span>
                <span className="text-slate-800 w-20 shrink-0 truncate">{l.action}</span>
                <span className="flex-1 truncate">{l.resource}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white ring-1 ring-slate-200 p-3">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <Sheet className="w-3.5 h-3.5 text-teal-500" />
            ERP 记录样本（{formatNumber(detail.erpRecords.length)}）
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto text-[11px] text-slate-600">
            {detail.erpRecords.slice(0, 6).map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50"
              >
                <span className="font-mono w-24 truncate">{r.documentNo}</span>
                <span className="font-mono w-20 text-right text-slate-800">
                  ¥{r.amount?.toFixed(2) ?? '-'}
                </span>
                <span className="flex-1 truncate text-slate-500">{r.department}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white ring-1 ring-slate-200 p-3">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-fuchsia-500" />
            邮件材料样本（{formatNumber(detail.emails.length)}）
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px] text-slate-600">
            {detail.emails.slice(0, 5).map((m, i) => (
              <div
                key={i}
                className="p-1.5 rounded hover:bg-slate-50"
              >
                <div className="text-slate-800 truncate font-medium">{m.subject}</div>
                <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                  <span className="truncate">{m.sender}</span>
                  <span>→</span>
                  <span className="truncate">{m.recipients.join(',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white ring-1 ring-slate-200 p-3">
          <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            生成的整改项（{formatNumber(detail.auditItems.length)}）
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto text-[11px]">
            {detail.auditItems.slice(0, 8).map((a) => (
              <Link
                key={a.id}
                href={`/audits/${a.id}`}
                className="block p-1.5 rounded hover:bg-brand-50/50 border border-transparent hover:border-brand-100"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      a.riskLevel === 'HIGH'
                        ? 'bg-red-500'
                        : a.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500',
                    )}
                  />
                  <span className="text-slate-800 truncate">{a.title}</span>
                </div>
                <div className="text-slate-400 ml-3.5 flex items-center gap-1.5">
                  <span className="font-mono">{a.status}</span>
                  <span>·</span>
                  <span>{a.dispatchRule}</span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href={`/import/${batchId}`}
            className="mt-3 w-full text-center text-[11px] text-brand-700 hover:underline font-medium"
          >
            查看完整批次详情 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ImportWizard({
  step,
  setStep,
  selectedSource,
  setSelectedSource,
  fileName,
  onFile,
  processing,
  onCancel,
  onConfirm,
}: {
  step: number;
  setStep: (n: number) => void;
  selectedSource: SourceType;
  setSelectedSource: (s: SourceType) => void;
  fileName: string;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const steps = ['选择数据源', '上传文件', '确认导入'];
  const meta = SOURCE_META[selectedSource];
  return (
    <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-2xl card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-600" />
            新建导入批次
          </h3>
          <button onClick={onCancel} className="btn-ghost !px-2 !py-1 text-xs">
            关闭
          </button>
        </div>

        <ol className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2 flex-1 last:flex-initial">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold shrink-0',
                  step >= i
                    ? 'bg-brand-700 text-white'
                    : 'bg-slate-100 text-slate-500',
                )}
              >
                {step > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm',
                  step >= i ? 'text-slate-800 font-medium' : 'text-slate-400',
                )}
              >
                {s}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-px flex-1',
                    step > i ? 'bg-brand-400' : 'bg-slate-200',
                  )}
                />
              )}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            {(['PERMISSION_LOG', 'ERP_EXPORT', 'EMAIL_MATERIAL', 'COMBINED'] as SourceType[]).map(
              (s) => {
                const m = SOURCE_META[s];
                const active = selectedSource === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSource(s)}
                    className={cn(
                      'text-left rounded-xl border p-4 transition',
                      active
                        ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-brand-200 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg text-white flex items-center justify-center bg-gradient-to-br shadow-sm',
                          m.color,
                        )}
                      >
                        {m.icon}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {SOURCE_LABEL[s]}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                      {m.hint}
                    </div>
                  </button>
                );
              },
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <div
                className={cn(
                  'w-14 h-14 mx-auto rounded-2xl text-white flex items-center justify-center bg-gradient-to-br shadow-md',
                  meta.color,
                )}
              >
                {meta.icon}
              </div>
              <div className="mt-3 text-sm font-medium text-slate-800">
                上传 {SOURCE_LABEL[selectedSource]} 数据文件
              </div>
              <div className="text-xs text-slate-500 mt-1">{meta.hint}</div>
              <label className="mt-5 inline-flex">
                <span className="btn-primary cursor-pointer">
                  <Upload className="w-4 h-4" />
                  选择文件
                </span>
                <input type="file" className="hidden" onChange={onFile} accept=".csv,.xlsx,.xls,.zip,.json,.eml" />
              </label>
              {fileName && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white ring-1 ring-slate-200 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {fileName}
                </div>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 ring-1 ring-amber-200 p-3 text-xs text-amber-800 leading-relaxed flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              大文件上传后会自动生成批次号并进入「处理中」状态，完成后可在列表中展开回查原始数据与生成的整改项。
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/70 bg-white divide-y divide-slate-100">
              {[
                ['数据源', SOURCE_LABEL[selectedSource]],
                ['文件', fileName || '未选择'],
                ['字段映射', '自动匹配（userId/action/resource 等关键列）'],
                ['派工规则', '按导入前设置的默认规则自动分派'],
                ['批次回查', '生成后支持展开查看原始样本与整改项关联'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-800 font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            {!fileName && (
              <div className="rounded-lg bg-red-50 ring-1 ring-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                请先返回「上传文件」选择一个数据文件。
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button onClick={onCancel} className="btn-outline !text-xs">
            取消
          </button>
          <div className="inline-flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="btn-outline !text-xs">
                上一步
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 ? false : !fileName}
                className="btn-primary !text-xs"
              >
                下一步
                <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <button
                onClick={onConfirm}
                disabled={!fileName || processing}
                className="btn-primary !text-xs"
              >
                {processing ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    创建批次中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    确认创建批次
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
