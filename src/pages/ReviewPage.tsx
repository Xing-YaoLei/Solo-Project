import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/main';
import * as RadixTabs from '@radix-ui/react-tabs';
import { QuoteCandleChart } from '@/components/charts/QuoteCandleChart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  mockVehicles,
  mockStores,
  mockDocuments,
  mockReviewTimeline,
  mockPreparationRecords,
  mockTestDriveRecords,
  mockQuoteRecords,
  mockQuoteCandles,
  mockSyncDelayInfo,
} from '@/data/mockData';
import { fetchReviewData, type ReviewData } from '@/services/endpoints';
import { STAGE_META, STAGE_ICONS, RISK_COLORS, RISK_LABELS, DOCUMENT_TYPES } from '@/utils/constants';
import { formatDate, formatDateTime, formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import {
  Car,
  Calendar,
  FileText,
  FileDown,
  FileSpreadsheet,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Wrench,
  Users,
} from 'lucide-react';

const THRESHOLD_LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  low: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  info: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

function getThresholdColor(level: string): string {
  return THRESHOLD_LEVEL_COLORS[level] ?? THRESHOLD_LEVEL_COLORS.info;
}

function createMockReviewData(vin: string): ReviewData {
  const vehicle = mockVehicles.find((v) => v.vin === vin) ?? mockVehicles[0];
  const store = mockStores.find((s) => s.id === vehicle.storeId) ?? mockStores[0];
  const documents = mockDocuments.filter((d) => d.vehicleId === vehicle.id);
  return {
    vehicle: { ...vehicle, alertsCount: 0, documents },
    store,
    documents,
    alerts: [],
    preparationRecords: mockPreparationRecords.map((p) => ({
      ...p,
      status: (p.status === 'completed' ? 'done' : p.status) as 'done' | 'in_progress' | 'pending',
    })),
    testDriveRecords: mockTestDriveRecords.map((t) => ({
      customerName: t.customerName,
      driveAt: t.driveAt,
      mileageAfter: t.mileage,
      salesPerson: t.salesPerson,
      rating: t.rating,
      feedback: t.feedback,
    })),
    quoteRecords: mockQuoteRecords.map((q) => ({
      amount: q.amount,
      source: q.source,
      quotedAt: q.date,
      isDeal: q.isDeal,
      dealPrice: q.dealPrice,
    })),
    timeline: [...mockReviewTimeline],
    thresholdHits: [],
  };
}

export default function ReviewPage() {
  const { vin = 'demo' } = useParams();

  const reviewQuery = useQuery({
    queryKey: QUERY_KEYS.review(vin),
    queryFn: async () => (await fetchReviewData(vin)).data,
    initialData: (): ReviewData => createMockReviewData(vin),
  });

  const vehicle = reviewQuery.data?.vehicle;
  const store = reviewQuery.data?.store;
  const vehicleDocs = reviewQuery.data?.documents ?? [];

  const timeline = reviewQuery.data?.timeline ?? [];
  const preparationRecords = reviewQuery.data?.preparationRecords ?? [];
  const testDriveRecords = reviewQuery.data?.testDriveRecords ?? [];
  const quoteRecords = reviewQuery.data?.quoteRecords ?? [];
  const thresholdHits = reviewQuery.data?.thresholdHits ?? [];

  const prepTotal = preparationRecords.reduce((acc, p) => acc + p.cost, 0);
  const completedPreps = preparationRecords.filter((p) => p.completedAt);
  const avgPrepDays = completedPreps.length > 0
    ? Math.round(
        completedPreps.reduce((acc, p) => acc + dayjs(p.completedAt!).diff(dayjs(p.startedAt), 'day', true), 0) /
          completedPreps.length
      )
    : 0;

  if (reviewQuery.isLoading || !vehicle) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-surface-card border border-surface-border p-6">
          <div className="flex items-start gap-5">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="xl:col-span-2 space-y-4">
            <Skeleton className="h-10 w-80 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-surface-card via-surface-card to-brand-500/5 border border-surface-border overflow-hidden p-6 relative">
        <div className="absolute inset-0 bg-glow-top pointer-events-none" />
        <div className="relative flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-blue shrink-0">
              <Car size={36} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                  {vehicle.brand} {vehicle.model} {vehicle.year}
                </h1>
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded-md font-semibold"
                  style={{ background: `${RISK_COLORS[vehicle.riskLevel]}22`, color: RISK_COLORS[vehicle.riskLevel], border: `1px solid ${RISK_COLORS[vehicle.riskLevel]}33` }}
                >
                  {RISK_LABELS[vehicle.riskLevel]}
                </span>
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded-md font-medium"
                  style={{ background: `${STAGE_META.find((m) => m.key === vehicle.stage)?.color}22`, color: STAGE_META.find((m) => m.key === vehicle.stage)?.color }}
                >
                  {STAGE_META.find((m) => m.key === vehicle.stage)?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={11} className="text-slate-500" />
                  VIN: <code className="font-mono text-slate-300">{vehicle.vin}</code>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Car size={11} className="text-slate-500" />
                  车牌: <span className="text-slate-300">{vehicle.plateNumber}</span>
                </span>
                {store && (
                  <span className="inline-flex items-center gap-1.5">
                    <Package size={11} className="text-slate-500" />
                    {store.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={11} className="text-slate-500" />
                  入库: <span className="text-slate-300">{formatDate(vehicle.inboundDate)}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={11} className="text-slate-500" />
                  库龄: <span className="text-amber-400 font-semibold">{vehicle.stockDays}天</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vehicleDocs.map((d) => {
                  const meta = DOCUMENT_TYPES.find((x) => x.key === d.type)!;
                  const Icon = meta.icon;
                  const statusColor = d.status === 'present' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : d.status === 'pending' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : d.status === 'expired' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                  return (
                    <span key={d.id} className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border', statusColor)}>
                      <Icon size={10} />
                      {meta.label}
                      {d.status === 'present' ? <CheckCircle2 size={9} /> : d.status === 'missing' ? <XCircle size={9} /> : <AlertCircle size={9} />}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => alert('已生成 PDF 报告（Demo）')}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white/5 border border-surface-border text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <FileDown size={14} /> 导出 PDF
            </button>
            <button
              onClick={() => alert('已导出 Excel（Demo）')}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors shadow-glow-blue"
            >
              <FileSpreadsheet size={14} /> 导出 Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-1 rounded-2xl bg-surface-card border border-surface-border p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={14} className="text-brand-400" />
            周转时间轴
          </h3>
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-500/50 via-amber-500/30 to-slate-700" />
            <ul className="space-y-4">
              {timeline.map((node, i) => {
                const StageIcon = STAGE_ICONS[node.stage as keyof typeof STAGE_ICONS];
                const stageMeta = STAGE_META.find((m) => m.key === node.stage)!;
                return (
                  <li key={i} className="relative pl-10">
                    <div
                      className="absolute left-0 top-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                      style={{ background: `${stageMeta.color}22`, border: `1px solid ${stageMeta.color}44` }}
                    >
                      <StageIcon size={14} style={{ color: stageMeta.color }} />
                    </div>
                    {node.hasDocIssue && (
                      <div className="absolute left-[30px] top-0 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold shadow-md z-10" style={{ transform: 'translate(50%, -50%)' }}>
                        ×
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-white">{node.label}</span>
                      <span className="text-[10px] text-slate-500">{formatDate(node.at)}</span>
                    </div>
                    <p className={cn('text-[11px] leading-relaxed', node.hasDocIssue ? 'text-rose-400' : 'text-slate-400')}>
                      {node.hasDocIssue && <AlertCircle size={10} className="inline -mt-0.5 mr-1" />}
                      {node.note}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="xl:col-span-2">
          {thresholdHits.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">命中规则：</span>
              {thresholdHits.map((hit, i) => (
                <span
                  key={i}
                  className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border font-medium', getThresholdColor(hit.level))}
                >
                  <AlertCircle size={9} />
                  {hit.thresholdName}（{hit.level}）
                </span>
              ))}
            </div>
          )}
          <RadixTabs.Root defaultValue="preparation">
            <RadixTabs.List className="inline-flex bg-surface-card border border-surface-border rounded-xl p-1 gap-1 mb-4">
              <ReviewTab value="preparation" icon={Wrench} count={preparationRecords.length}>整备清单</ReviewTab>
              <ReviewTab value="testdrive" icon={Users} count={testDriveRecords.length}>试驾记录</ReviewTab>
              <ReviewTab value="quote" icon={FileSpreadsheet} count={quoteRecords.length}>报价历史</ReviewTab>
            </RadixTabs.List>

            <RadixTabs.Content value="preparation" className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface-elevated/30">
                    <tr className="text-slate-400 text-left">
                      <th className="px-5 py-3 font-medium">项目名</th>
                      <th className="px-4 py-3 font-medium">类别</th>
                      <th className="px-4 py-3 font-medium">成本</th>
                      <th className="px-4 py-3 font-medium">状态</th>
                      <th className="px-4 py-3 font-medium">开始</th>
                      <th className="px-5 py-3 font-medium">完成</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparationRecords.map((p, i) => (
                      <tr key={i} className="border-t border-surface-border hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-slate-200 font-medium">{p.itemName}</td>
                        <td className="px-4 py-3 text-slate-400">{p.category}</td>
                        <td className="px-4 py-3 text-slate-300 tabular-nums">{formatMoney(p.cost)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">{formatDate(p.startedAt)}</td>
                        <td className="px-5 py-3 text-slate-400 text-[11px]">{p.completedAt ? formatDate(p.completedAt) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 bg-surface-elevated/30 border-t border-surface-border">
                <div className="text-xs text-slate-400">
                  合计成本 <span className="text-white font-semibold ml-1 text-base">{formatMoney(prepTotal)}</span>
                </div>
                <div className="text-xs text-slate-400">
                  平均整备耗时 <span className="text-amber-400 font-semibold ml-1 text-base">{avgPrepDays} 天</span>
                </div>
              </div>
            </RadixTabs.Content>

            <RadixTabs.Content value="testdrive" className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface-elevated/30">
                    <tr className="text-slate-400 text-left">
                      <th className="px-5 py-3 font-medium">客户</th>
                      <th className="px-4 py-3 font-medium">试驾里程</th>
                      <th className="px-4 py-3 font-medium">销售顾问</th>
                      <th className="px-4 py-3 font-medium">评分</th>
                      <th className="px-4 py-3 font-medium">反馈</th>
                      <th className="px-5 py-3 font-medium">试驾时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testDriveRecords.map((t, i) => (
                      <tr key={i} className="border-t border-surface-border hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-slate-200 font-medium">{t.customerName}</td>
                        <td className="px-4 py-3 text-slate-300 tabular-nums">
                          {t.mileageAfter !== undefined
                            ? `${t.mileageBefore ?? '—'} → ${t.mileageAfter} km`
                            : t.mileageBefore !== undefined
                            ? `${t.mileageBefore} km`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{t.salesPerson ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {Array.from({ length: t.rating }).map((_, j) => (
                              <Star key={j} size={12} fill="currentColor" />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-[260px] truncate">{t.feedback ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-400 text-[11px]">{formatDateTime(t.driveAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 bg-surface-elevated/30 border-t border-surface-border">
                <div className="text-xs text-slate-400">
                  试驾批次 <span className="text-white font-semibold ml-1 text-base">{testDriveRecords.length} 次</span>
                </div>
                <div className="text-xs text-slate-400">
                  平均评分 <span className="text-amber-400 font-semibold ml-1 text-base">
                    {testDriveRecords.length > 0 ? (testDriveRecords.reduce((a, t) => a + t.rating, 0) / testDriveRecords.length).toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
            </RadixTabs.Content>

            <RadixTabs.Content value="quote" className="space-y-4">
              <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden p-4">
                <h4 className="text-xs font-semibold text-white mb-2">报价历史走势图</h4>
                <QuoteCandleChart data={mockQuoteCandles.slice(-15)} delays={mockSyncDelayInfo} compact />
              </div>
              <div className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-elevated/30">
                      <tr className="text-slate-400 text-left">
                        <th className="px-5 py-3 font-medium">日期</th>
                        <th className="px-4 py-3 font-medium">报价金额</th>
                        <th className="px-4 py-3 font-medium">来源</th>
                        <th className="px-4 py-3 font-medium">成交状态</th>
                        <th className="px-5 py-3 font-medium text-right">成交价</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteRecords.map((q, i) => (
                        <tr key={i} className="border-t border-surface-border hover:bg-white/[0.02]">
                          <td className="px-5 py-3 text-slate-300">{formatDate(q.quotedAt)}</td>
                          <td className="px-4 py-3 text-slate-200 tabular-nums font-medium">{formatMoney(q.amount)}</td>
                          <td className="px-4 py-3 text-slate-400">{q.source}</td>
                          <td className="px-4 py-3">
                            {q.isDeal ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-medium">
                                <CheckCircle2 size={10} /> 已成交
                              </span>
                            ) : (
                              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400">报价中</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {q.dealPrice ? (
                              <span className="text-rose-400 font-semibold">{formatMoney(q.dealPrice)}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </RadixTabs.Content>
          </RadixTabs.Root>
        </div>
      </div>
    </div>
  );
}

function ReviewTab({ value, icon: Icon, count, children }: { value: string; icon: any; count: number; children: React.ReactNode }) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        'data-[state=active]:bg-brand-500/20 data-[state=active]:text-white data-[state=active]:shadow-glow-blue data-[state=active]:border data-[state=active]:border-brand-500/20',
        'text-slate-400 hover:text-slate-200'
      )}
    >
      <Icon size={15} />
      {children}
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 data-[state=active]:bg-brand-500/20 data-[state=active]:text-slate-200">
        {count}
      </span>
    </RadixTabs.Trigger>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg =
    status === 'done' || status === 'completed'
      ? { text: '已完成', cls: 'bg-emerald-500/15 text-emerald-400' }
      : status === 'in_progress'
      ? { text: '进行中', cls: 'bg-amber-500/15 text-amber-400' }
      : { text: '待处理', cls: 'bg-slate-500/15 text-slate-400' };
  return (
    <span className={cn('text-[11px] px-2 py-0.5 rounded-md font-medium', cfg.cls)}>
      {cfg.text}
    </span>
  );
}
