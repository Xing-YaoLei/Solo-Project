import Link from 'next/link';
import { redirect } from 'next/navigation';
import { listBatches, createAuditBatch } from '@/app/actions/batches';
import { SourceBadge, BatchStatusBadge, RiskBadge } from '@/components/ui/Badges';
import { cn, formatDateTime, formatNumber, SOURCE_LABEL } from '@/lib/utils';
import type { SourceType } from '@/lib/utils';
import {
  Upload,
  Database,
  Sheet,
  Mail,
  ArrowRight,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronDown,
  FileSearch,
  Loader,
  CheckCircle2,
} from 'lucide-react';
import { ImportWizardButton } from './ImportWizard';

export default async function ImportCenterPage() {
  let batches: any[] = [];
  try {
    batches = await listBatches();
  } catch (e: any) {
    if (e.message?.includes('无权') || e.message?.includes('allowed') || e.message?.includes('REDIRECT')) redirect('/my-tasks?forbidden=import');
    throw e;
  }

  const srcCounts = {
    PERMISSION_LOG: batches.reduce((s: number, b: any) => s + (b._count?.permLogs ?? 0), 0),
    ERP_EXPORT: batches.reduce((s: number, b: any) => s + (b._count?.erpRecords ?? 0), 0),
    EMAIL_MATERIAL: batches.reduce((s: number, b: any) => s + (b._count?.emails ?? 0), 0),
    audits: batches.reduce((s: number, b: any) => s + (b._count?.auditItems ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <StepCard
          step={1}
          title="解析权限日志"
          desc="CSV 格式，按行为基线扫描，输出待整改权限异常"
          count={srcCounts.PERMISSION_LOG}
          icon={Database}
          accent="brand"
        />
        <StepCard
          step={2}
          title="合并 ERP 导出"
          desc="采购、付款、合同单据交叉校验，补充金额与审批链"
          count={srcCounts.ERP_EXPORT}
          icon={Sheet}
          accent="amber"
        />
        <StepCard
          step={3}
          title="融合邮件材料"
          desc="法务/审计/举报邮件解析，沉淀定性结论与佐证"
          count={srcCounts.EMAIL_MATERIAL}
          icon={Mail}
          accent="emerald"
        />
      </div>

      <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-brand-600" />
            批次列表 · 全量可回查
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            点击批次进入详情，查看原始权限日志 / ERP / 邮件 与生成的整改项
          </p>
        </div>
        <ImportWizardButton onCreate={createAuditBatch as any} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 font-medium text-left">批次号</th>
                <th className="px-4 py-3 font-medium text-left">来源类型</th>
                <th className="px-4 py-3 font-medium text-left">文件名 / 创建人</th>
                <th className="px-4 py-3 font-medium">记录</th>
                <th className="px-4 py-3 font-medium">整改项</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium text-left">创建时间</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b: any) => (
                <>
                  <BatchRow key={b.id} b={b} />
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BatchRow({ b }: { b: any }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50/60 transition align-top">
      <td className="px-4 py-3 font-mono text-xs">
        <Link href={`/import/${b.id}`} className="text-brand-700 hover:underline font-semibold">
          {b.batchNo}
        </Link>
      </td>
      <td className="px-4 py-3 text-center">
        <SourceBadge type={b.sourceType as SourceType} />
      </td>
      <td className="px-4 py-3">
        <div className="text-slate-700 text-xs line-clamp-1">{b.fileName || '-'}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{b.createdBy?.name}</div>
      </td>
      <td className="px-4 py-3 text-center font-mono text-xs">
        {formatNumber((b._count?.permLogs ?? 0) + (b._count?.erpRecords ?? 0) + (b._count?.emails ?? 0))}
      </td>
      <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-brand-700">
        {formatNumber(b._count?.auditItems ?? 0)}
      </td>
      <td className="px-4 py-3 text-center">
        <BatchStatusBadge status={b.status as any} />
      </td>
      <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{formatDateTime(b.createdAt).slice(0, 16)}</td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/import/${b.id}`}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
        >
          回查 <ChevronRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}

function StepCard({
  step, title, desc, count, icon: Icon, accent,
}: {
  step: number; title: string; desc: string; count: number; icon: any;
  accent: 'brand' | 'amber' | 'emerald';
}) {
  const colors = {
    brand: 'from-brand-500 to-brand-800 text-white ring-brand-200',
    amber: 'from-amber-500 to-orange-700 text-white ring-amber-200',
    emerald: 'from-emerald-500 to-teal-700 text-white ring-emerald-200',
  }[accent];
  return (
    <div className="card p-5 overflow-hidden relative">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${colors.split(' ').slice(0, 2).join(' ')}`} />
      <div className="flex items-start gap-3 relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center shadow-md ring-4`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="chip bg-slate-100 text-slate-600 text-[10px]">Step {step}</span>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{formatNumber(count)}</span>
            <span className="text-[11px] text-slate-400">已解析记录</span>
          </div>
        </div>
      </div>
    </div>
  );
}
