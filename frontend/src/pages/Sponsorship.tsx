import { useState, useMemo, useCallback, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import {
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  FileText,
  Hash,
} from 'lucide-react';
import type { SponsorshipItem, SponsorshipDetail, FulfillmentRecord } from '@/types';
import { sponsorshipApi } from '@/api/modules/sponsorship';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  change?: number;
  changeLabel?: string;
  highlight?: string;
}

function KpiCard({ title, value, icon, iconBg, iconColor, change, changeLabel, highlight }: KpiCardProps) {
  const hasChange = change !== undefined;
  const isPositive = change && change >= 0;
  return (
    <div className="panel">
      <div className="panel-body py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="stat-label mb-2">{title}</div>
            <div className="flex items-baseline gap-2">
              <span className={cn('stat-value text-2xl', highlight)}>{value}</span>
              {hasChange && (
                <span className={cn(
                  'flex items-center gap-0.5 text-[11px] font-medium',
                  isPositive ? 'text-green-success' : 'text-red-danger'
                )}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{change!.toFixed(1)}%
                </span>
              )}
            </div>
            {changeLabel && <div className="text-[11px] text-white/40 mt-1">{changeLabel}</div>}
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagChip({ label, variant }: { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'muted' }) {
  const variants = {
    success: 'bg-green-success/15 text-green-success border-green-success/40',
    warning: 'bg-orange-warning/15 text-orange-warning border-orange-warning/40',
    danger: 'bg-red-danger/15 text-red-danger border-red-danger/40',
    info: 'bg-cyan-primary/15 text-cyan-glow border-cyan-primary/40',
    muted: 'bg-white/8 text-white/60 border-white/15',
  } as const;
  return (
    <span className={cn('chip border', variants[variant])}>
      {label}
    </span>
  );
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  const s = status.toLowerCase();
  if (s.includes('完成') || s === 'active' || s.includes('已完成')) return 'success';
  if (s.includes('进行') || s.includes('执行') || s === 'pending') return 'info';
  if (s.includes('逾期') || s.includes('风险') || s.includes('异常')) return 'danger';
  if (s.includes('待') || s.includes('准备')) return 'warning';
  return 'muted';
}

function getRiskVariant(tag: string | undefined): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (!tag) return 'muted';
  const t = tag.toLowerCase();
  if (t.includes('高') || t.includes('紧急')) return 'danger';
  if (t.includes('中') || t.includes('延迟')) return 'warning';
  if (t.includes('低') || t.includes('提醒')) return 'info';
  return 'muted';
}

function ProgressBar({ rate, height = 8 }: { rate: number; height?: number }) {
  const percent = Math.round(rate * 100);
  const color = rate >= 0.9 ? '#00E396' : rate >= 0.7 ? '#00D4FF' : rate >= 0.5 ? '#FF8A00' : '#FF3D57';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 bg-white/6 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color }}>
        {percent}%
      </span>
    </div>
  );
}

export default function SponsorshipPage() {
  const [list, setList] = useState<SponsorshipItem[]>([]);
  const [allItems, setAllItems] = useState<SponsorshipItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SponsorshipDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await sponsorshipApi.getList({ page, pageSize });
      if (res) {
        setList(res.items);
        setTotal(res.pageInfo.total);
        if (page === 1) {
          setAllItems(res.items);
        }
      }
    } catch (e) {
      console.error('Failed to fetch sponsorship list:', e);
    } finally {
      setLoadingList(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const statusOptions = useMemo(() => {
    const set = new Set(allItems.map((s) => s.status));
    return ['all', ...Array.from(set)];
  }, [allItems]);

  const filteredList = useMemo(() => {
    if (statusFilter === 'all') return list;
    return list.filter((s) => s.status === statusFilter);
  }, [list, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedList = filteredList;

  const kpiSummary = useMemo(() => {
    const totalSponsors = new Set(allItems.map((s) => s.sponsorId)).size;
    const totalBenefits = allItems.reduce((s, i) => s + i.contractQty, 0);
    const totalFulfilled = allItems.reduce((s, i) => s + i.fulfilledQty, 0);
    const completionRate = totalBenefits > 0 ? totalFulfilled / totalBenefits : 0;
    const riskCount = allItems.filter((s) => s.riskTag && (s.riskTag.includes('高') || s.riskTag.includes('中'))).length;
    return {
      totalSponsors,
      totalBenefits,
      completionRate,
      riskCount,
      completionChange: 2.8,
      riskChange: -12.5,
    };
  }, [allItems]);

  const handleViewDetail = useCallback(async (item: SponsorshipItem) => {
    setDrawerOpen(true);
    setLoadingDetail(true);
    setSelectedDetail(null);
    try {
      const res = await sponsorshipApi.getDetail(item.id);
      if (res) {
        setSelectedDetail(res);
      }
    } catch (e) {
      console.error('Failed to fetch sponsorship detail:', e);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedDetail(null), 300);
  };

  const progressOption = useMemo<EChartsOption | null>(() => {
    if (!selectedDetail) return null;
    const rate = selectedDetail.completionRate;
    const completed = Math.round(rate * 100);
    const color = rate >= 0.9 ? '#00E396' : rate >= 0.7 ? '#00D4FF' : rate >= 0.5 ? '#FF8A00' : '#FF3D57';
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          radius: '85%',
          center: ['50%', '50%'],
          progress: {
            show: true,
            width: 14,
            roundCap: true,
            itemStyle: {
              color: {
                type: 'linear' as const,
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color },
                  { offset: 1, color: `${color}99` },
                ],
              },
              shadowBlur: 12,
              shadowColor: `${color}55`,
            },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 14,
              color: [[1, 'rgba(255,255,255,0.08)']] as any,
            },
          },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            width: 60,
            height: 40,
            top: '38%',
            formatter: `{a|${completed}%}\n{b|兑现进度}`,
            rich: {
              a: {
                fontSize: 32,
                fontWeight: 'bold',
                fontFamily: 'Chakra Petch, sans-serif',
                color,
                lineHeight: 40,
              },
              b: {
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                padding: [6, 0, 0, 0],
              },
            },
          },
          data: [{ value: completed }],
        },
      ] as any,
    } as EChartsOption;
  }, [selectedDetail]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="总赞助商数"
          value={kpiSummary.totalSponsors}
          icon={<Building2 className="w-5 h-5" />}
          iconBg="bg-cyan-primary/15"
          iconColor="text-cyan-glow"
          change={5.3}
          changeLabel="较上月"
          highlight="glow-text"
        />
        <KpiCard
          title="总权益项数"
          value={kpiSummary.totalBenefits.toLocaleString()}
          icon={<FileCheck2 className="w-5 h-5" />}
          iconBg="bg-purple-sponsor/15"
          iconColor="text-purple-sponsor"
          change={8.7}
          changeLabel="较上月"
        />
        <KpiCard
          title="权益完成率"
          value={`${(kpiSummary.completionRate * 100).toFixed(1)}%`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-green-success/15"
          iconColor="text-green-success"
          change={kpiSummary.completionChange}
          changeLabel="较上月"
          highlight="text-green-success"
        />
        <KpiCard
          title="风险项数"
          value={kpiSummary.riskCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-red-danger/15"
          iconColor="text-red-danger"
          change={kpiSummary.riskChange}
          changeLabel="较上月"
          highlight="text-red-danger"
        />
      </div>

      <div className="panel">
        <div className="panel-header flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="panel-title">赞助清单</h2>
            <div className="flex items-center gap-1.5 bg-ocean-dark/60 rounded-full p-0.5 border border-panel-border/60 flex-wrap">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setStatusFilter(opt); setPage(1); }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
                    statusFilter === opt
                      ? 'bg-cyan-primary/20 text-cyan-glow shadow-glow-cyan'
                      : 'text-white/60 hover:text-white/85'
                  )}
                >
                  {opt === 'all' ? '全部' : opt}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-white/50">
            共 <span className="text-cyan-glow font-semibold">{total}</span> 条记录
            {loadingList && <span className="ml-2 text-cyan-primary/70">加载中...</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-panel-border/60">
                <th className="text-left py-3 px-5 font-medium text-white/60 text-xs uppercase tracking-wider">赞助商</th>
                <th className="text-left py-3 px-3 font-medium text-white/60 text-xs uppercase tracking-wider">权益类型</th>
                <th className="text-center py-3 px-3 font-medium text-white/60 text-xs uppercase tracking-wider">合同数</th>
                <th className="text-center py-3 px-3 font-medium text-white/60 text-xs uppercase tracking-wider">已兑现</th>
                <th className="text-left py-3 px-3 font-medium text-white/60 text-xs uppercase tracking-wider w-48">完成率</th>
                <th className="text-center py-3 px-3 font-medium text-white/60 text-xs uppercase tracking-wider">状态</th>
                <th className="text-center py-3 px-3 font-medium text-white/60 text-xs uppercase tracking-wider">风险</th>
                <th className="text-center py-3 px-5 font-medium text-white/60 text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {loadingList && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/50 text-sm">
                    加载中...
                  </td>
                </tr>
              )}
              {!loadingList && pagedList.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-panel-border/25 hover:bg-cyan-primary/5 transition-colors"
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-primary/25 to-purple-sponsor/25 flex items-center justify-center shrink-0 border border-panel-border/40">
                        <Building2 className="w-4.5 h-4.5 text-cyan-glow" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white/95 truncate max-w-[160px]">{item.sponsorName}</div>
                        <div className="text-[11px] text-white/45 mt-0.5 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>{item.sponsorLevel}</span>
                          <span className="opacity-40">·</span>
                          <span>{item.sponsorId}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-white/80">{item.benefitType}</td>
                  <td className="py-4 px-3 text-center text-white/80 font-medium tabular-nums">{item.contractQty}</td>
                  <td className="py-4 px-3 text-center text-green-success font-semibold tabular-nums">{item.fulfilledQty}</td>
                  <td className="py-4 px-3">
                    <ProgressBar rate={item.completionRate} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    <TagChip label={item.status} variant={getStatusVariant(item.status)} />
                  </td>
                  <td className="py-4 px-3 text-center">
                    {item.riskTag ? (
                      <TagChip label={item.riskTag} variant={getRiskVariant(item.riskTag)} />
                    ) : (
                      <span className="text-white/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button
                      onClick={() => handleViewDetail(item)}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                        'bg-cyan-primary/12 border border-cyan-primary/35 text-cyan-glow',
                        'hover:bg-cyan-primary/22 hover:shadow-glow-cyan hover:border-cyan-primary/55'
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      查看明细
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingList && pagedList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/40 text-sm">
                    暂无匹配的赞助记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-panel-border/40">
          <div className="text-xs text-white/50">
            第 <span className="text-cyan-glow font-medium">{page}</span> / {totalPages} 页
            <span className="mx-2 opacity-30">|</span>
            每页 {pageSize} 条
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all',
                page === 1
                  ? 'text-white/25 cursor-not-allowed'
                  : 'text-white/65 hover:text-cyan-glow hover:bg-cyan-primary/10 border border-transparent hover:border-cyan-primary/30'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .map((n, i, arr) => (
                <span key={`gap-${n}-${i}`}>
                  {i > 0 && n - arr[i - 1] > 1 && (
                    <span className="px-1.5 text-white/30 text-xs">...</span>
                  )}
                  <button
                    onClick={() => setPage(n)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      page === n
                        ? 'bg-cyan-primary/25 text-cyan-glow shadow-glow-cyan border border-cyan-primary/45'
                        : 'text-white/65 hover:text-cyan-glow hover:bg-white/5 border border-transparent'
                    )}
                  >
                    {n}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all',
                page === totalPages
                  ? 'text-white/25 cursor-not-allowed'
                  : 'text-white/65 hover:text-cyan-glow hover:bg-cyan-primary/10 border border-transparent hover:border-cyan-primary/30'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />
          <div
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-[600px] max-w-[92vw]',
              'bg-ocean-dark/98 border-l border-panel-border/60 shadow-card',
              'flex flex-col animate-slide-in-right'
            )}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-panel-border/50">
              <div>
                <h3 className="font-display font-semibold text-lg text-white tracking-wide">
                  赞助权益明细
                </h3>
                {selectedDetail && (
                  <div className="text-xs text-white/50 mt-1">{selectedDetail.sponsorName}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedDetail && (
                  <a
                    href={`/sponsorship/${selectedDetail.id}`}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      'bg-purple-sponsor/12 border border-purple-sponsor/35 text-purple-sponsor',
                      'hover:bg-purple-sponsor/22 hover:shadow-glow-purple'
                    )}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    跳转详情
                  </a>
                )}
                <button
                  onClick={handleCloseDrawer}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loadingDetail && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-white/50">加载中...</div>
              </div>
            )}

            {!loadingDetail && selectedDetail && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-5 border-b border-panel-border/30 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-panel-bg rounded-xl p-3.5 border border-panel-border/50">
                      <div className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        赞助商
                      </div>
                      <div className="font-medium text-white/95 truncate">{selectedDetail.sponsorName}</div>
                      <div className="text-[11px] text-white/45 mt-1">{selectedDetail.sponsorLevel} · {selectedDetail.sponsorId}</div>
                    </div>
                    <div className="bg-panel-bg rounded-xl p-3.5 border border-panel-border/50">
                      <div className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        权益类型
                      </div>
                      <div className="font-medium text-white/95">{selectedDetail.benefitType}</div>
                      <div className="text-[11px] text-white/45 mt-1">单号 {selectedDetail.id}</div>
                    </div>
                    <div className="bg-panel-bg rounded-xl p-3.5 border border-panel-border/50">
                      <div className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        联系方式
                      </div>
                      <div className="text-sm text-white/85 truncate">{selectedDetail.sponsorContact}</div>
                    </div>
                    <div className="bg-panel-bg rounded-xl p-3.5 border border-panel-border/50">
                      <div className="text-[11px] text-white/50 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        截止日期
                      </div>
                      <div className="text-sm text-white/85">{selectedDetail.deadline}</div>
                      <div className="mt-1.5">
                        <TagChip label={selectedDetail.status} variant={getStatusVariant(selectedDetail.status)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5 border-b border-panel-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-semibold text-sm text-white/90">兑现进度</h4>
                    <div className="text-xs text-white/50">
                      <span className="text-green-success font-semibold">{selectedDetail.fulfilledQty}</span>
                      <span className="mx-1 opacity-50">/</span>
                      <span className="text-white/75">{selectedDetail.contractQty}</span>
                      <span className="ml-1 text-white/40">项</span>
                    </div>
                  </div>
                  <div className="bg-panel-bg rounded-xl border border-panel-border/50 p-3" style={{ height: 180 }}>
                    {progressOption && (
                      <ReactECharts
                        option={progressOption}
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'canvas' }}
                      />
                    )}
                  </div>
                  <div className="mt-3">
                    <ProgressBar rate={selectedDetail.completionRate} height={10} />
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-display font-semibold text-sm text-white/90">兑现记录时间轴</h4>
                    <span className="text-[11px] text-white/45">共 {selectedDetail.fulfillmentRecords.length} 条</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-primary/50 via-cyan-primary/20 to-transparent" />
                    <div className="space-y-5">
                      {selectedDetail.fulfillmentRecords
                        .slice()
                        .sort((a, b) => b.fulfilledAt.localeCompare(a.fulfilledAt))
                        .map((record, idx) => (
                          <div key={record.id} className="relative pl-9">
                            <div className={cn(
                              'absolute left-0 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2',
                              idx === 0
                                ? 'bg-cyan-primary/20 border-cyan-primary shadow-glow-cyan'
                                : 'bg-ocean-dark border-white/15'
                            )}>
                              <div className={cn(
                                'w-2 h-2 rounded-full',
                                idx === 0 ? 'bg-cyan-glow animate-pulse-glow' : 'bg-white/30'
                              )} />
                            </div>
                            <div className="bg-panel-bg rounded-xl p-3.5 border border-panel-border/40 hover:border-cyan-primary/30 transition-colors">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="w-3 h-3 text-cyan-primary/70" />
                                  <span className="text-white/70 font-medium">{record.fulfilledAt}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-green-success/12 text-green-success text-[11px] font-medium border border-green-success/30">
                                  +{record.quantity} 项
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <div className="text-white/45 mb-0.5">操作人</div>
                                  <div className="text-white/85 flex items-center gap-1.5">
                                    <User className="w-3 h-3 text-white/40" />
                                    {record.recipient}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-white/45 mb-0.5">凭证</div>
                                  <div className="text-white/85 font-mono text-[11px] truncate">
                                    {record.id}
                                  </div>
                                </div>
                              </div>
                              {record.remark && (
                                <div className="mt-2.5 pt-2.5 border-t border-panel-border/30">
                                  <div className="text-[11px] text-white/45 mb-0.5">备注</div>
                                  <div className="text-xs text-white/70">{record.remark}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
