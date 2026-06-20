import { useEffect, useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import {
  Ticket,
  DollarSign,
  Users,
  ShieldCheck,
  TrendingUp,
  Zap,
  Database,
  Cloud,
  Server,
  RefreshCw,
} from 'lucide-react';
import dayjs from 'dayjs';
import KpiCard from '@/components/common/KpiCard';
import ChartCard from '@/components/common/ChartCard';
import Panel from '@/components/common/Panel';
import TagChip from '@/components/common/TagChip';
import { kpiApi } from '@/api/modules/kpi';
import { refundApi } from '@/api/modules/refund';
import { ticketApi } from '@/api/modules/ticket';
import { pipelineApi } from '@/api/modules/pipeline';

interface LocalKpi {
  totalTickets: number;
  totalRevenue: number;
  totalCheckins: number;
  avgTicketPrice: number;
  checkinRate: number;
  conversionRate: number;
  totalSponsorship: number;
  ticketsCompared: number;
  revenueCompared: number;
  checkinsCompared: number;
}

interface LocalTrendPoint {
  date: string;
  tickets: number;
  revenue: number;
  checkins: number;
}

interface LocalRefundPoint {
  status: string;
  label: string;
  count: number;
  amount: number;
}

interface LocalTicketRank {
  ticketType: string;
  sold: number;
  revenue: number;
  percentage: number;
  color: string;
}

interface PipelineSummary {
  pending: number;
  synced: number;
  verified: number;
  completed: number;
  failed: number;
}

type NodeStatus = 'online' | 'syncing' | 'offline';

interface PipelineNode {
  id: string;
  name: string;
  icon: typeof Database;
  x: number;
  y: number;
  status: NodeStatus;
}

const pipelineNodes: PipelineNode[] = [
  { id: 'source1', name: '票务系统', icon: Ticket, x: 80, y: 120, status: 'online' },
  { id: 'source2', name: '核验终端', icon: Server, x: 80, y: 240, status: 'syncing' },
  { id: 'source3', name: '赞助平台', icon: Cloud, x: 80, y: 360, status: 'online' },
  { id: 'center', name: '数据中台', icon: Database, x: 400, y: 240, status: 'syncing' },
];

function SyncPipelineDiagram({ status }: { status: PipelineSummary | null }) {
  const statusColor: Record<NodeStatus, string> = {
    online: '#00E396',
    syncing: '#00D4FF',
    offline: '#FF3D57',
  };

  const statusLabel: Record<NodeStatus, string> = {
    online: '在线',
    syncing: '同步中',
    offline: '离线',
  };

  const effectiveStatus: PipelineSummary = status ?? {
    pending: 128,
    synced: 2840,
    verified: 2560,
    completed: 2400,
    failed: 7,
  };

  return (
    <div className="relative w-full" style={{ height: 460 }}>
      <svg
        viewBox="0 0 520 480"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="home-nodeGlow-green" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E396" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#00E396" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00E396" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="home-nodeGlow-cyan" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#00D4FF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="home-nodeGlow-red" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF3D57" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#FF3D57" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FF3D57" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="home-arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {pipelineNodes.slice(0, 3).map((node) => {
          const target = pipelineNodes[3];
          const startX = node.x + 36;
          const startY = node.y;
          const endX = target.x - 42;
          const endY = target.y;
          const midX = (startX + endX) / 2;
          const path = `M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`;
          const gradId =
            node.status === 'syncing'
              ? 'url(#home-nodeGlow-cyan)'
              : node.status === 'online'
                ? 'url(#home-nodeGlow-green)'
                : 'url(#home-nodeGlow-red)';

          return (
            <g key={`home-conn-${node.id}`}>
              <path
                d={path}
                fill="none"
                stroke="url(#home-arrowGrad)"
                strokeWidth="2"
                strokeDasharray="6 6"
                strokeLinecap="round"
                style={{
                  animation: `flowLine 1.5s linear infinite ${node.status === 'offline' ? 'paused' : 'running'}`,
                  opacity: node.status === 'offline' ? 0.25 : 1,
                }}
              />
              <circle r="4" fill={statusColor[node.status]} opacity="0.9">
                <animateMotion
                  dur={node.status === 'offline' ? '0s' : '2.2s'}
                  repeatCount="indefinite"
                  path={path}
                />
              </circle>
              <desc>{gradId}</desc>
            </g>
          );
        })}

        {pipelineNodes.map((node) => {
          const color = statusColor[node.status];
          const gradId =
            node.status === 'syncing'
              ? 'url(#home-nodeGlow-cyan)'
              : node.status === 'online'
                ? 'url(#home-nodeGlow-green)'
                : 'url(#home-nodeGlow-red)';
          const IconCmp = node.icon;
          const isCenter = node.id === 'center';

          return (
            <g key={`home-node-${node.id}`} transform={`translate(${node.x},${node.y})`}>
              <circle r={isCenter ? 56 : 46} fill={gradId}>
                {node.status === 'syncing' && (
                  <animate
                    attributeName="r"
                    values={`${isCenter ? 50 : 40};${isCenter ? 60 : 52};${isCenter ? 50 : 40}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>

              <circle
                r={isCenter ? 40 : 32}
                fill="rgba(6,18,41,0.9)"
                stroke={color}
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
              />

              <foreignObject
                x={isCenter ? -18 : -14}
                y={isCenter ? -18 : -14}
                width={isCenter ? 36 : 28}
                height={isCenter ? 36 : 28}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ color }}
                >
                  <IconCmp size={isCenter ? 24 : 20} strokeWidth={2} />
                </div>
              </foreignObject>

              <text
                y={isCenter ? 62 : 50}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="12"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {node.name}
              </text>

              <circle
                cx={isCenter ? 28 : 22}
                cy={isCenter ? -28 : -22}
                r="5"
                fill={color}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              >
                {node.status === 'syncing' && (
                  <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                )}
              </circle>
              <text
                x={isCenter ? 40 : 32}
                y={isCenter ? -24 : -18}
                fill={color}
                fontSize="10"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
              >
                {statusLabel[node.status]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-2 px-2">
        {[
          { label: '待同步', value: effectiveStatus.pending, color: 'warning' as const },
          { label: '已同步', value: effectiveStatus.synced, color: 'info' as const },
          { label: '已核验', value: effectiveStatus.verified, color: 'success' as const },
          { label: '失败', value: effectiveStatus.failed, color: 'danger' as const },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-ocean-dark/60 border border-panel-border/40 px-2 py-2 text-center"
          >
            <div className="text-[10px] text-white/50 tracking-wider uppercase">{s.label}</div>
            <div className="font-display font-bold text-base text-white mt-0.5 tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultKpi: LocalKpi = {
  totalTickets: 8420,
  totalRevenue: 2856420,
  totalCheckins: 6250,
  avgTicketPrice: 339,
  checkinRate: 89.4,
  conversionRate: 12.6,
  totalSponsorship: 580000,
  ticketsCompared: 7850,
  revenueCompared: 2540000,
  checkinsCompared: 5890,
};

const defaultTrend: LocalTrendPoint[] = Array.from({ length: 14 }, (_, i) => ({
  date: dayjs().subtract(13 - i, 'day').format('MM-DD'),
  tickets: [120, 135, 142, 158, 170, 165, 188, 210, 205, 230, 245, 260, 280, 310][i],
  revenue: [8.2, 9.1, 10.5, 11.2, 12.8, 13.5, 15.2, 16.8, 17.5, 18.2, 19.6, 21.5, 23.8, 25.2][i],
  checkins: [90, 105, 110, 125, 138, 140, 160, 178, 182, 200, 218, 235, 258, 275][i],
}));

const defaultRefundDist: LocalRefundPoint[] = [
  { status: 'pending', label: '待处理', count: 128, amount: 58400 },
  { status: 'processing', label: '处理中', count: 56, amount: 24800 },
  { status: 'approved', label: '已批准', count: 342, amount: 156400 },
  { status: 'completed', label: '已完成', count: 890, amount: 402300 },
  { status: 'rejected', label: '已拒绝', count: 45, amount: 18600 },
];

const defaultTicketRank: LocalTicketRank[] = [
  { ticketType: 'VIP 票', sold: 1280, revenue: 1280000, percentage: 18.2, color: '#8B5CF6' },
  { ticketType: '普通票', sold: 4520, revenue: 1356000, percentage: 64.3, color: '#00D4FF' },
  { ticketType: '学生票', sold: 680, revenue: 102000, percentage: 9.7, color: '#00E396' },
  { ticketType: '团体票', sold: 420, revenue: 92400, percentage: 6.0, color: '#FF8A00' },
  { ticketType: '赠票', sold: 130, revenue: 0, percentage: 1.8, color: '#FACC15' },
];

const defaultPipelineSummary: PipelineSummary = {
  pending: 128,
  synced: 2840,
  verified: 2560,
  completed: 2400,
  failed: 7,
};

export default function Home() {
  const [kpiOverview, setKpiOverview] = useState<LocalKpi>(defaultKpi);
  const [kpiTrend, setKpiTrend] = useState<LocalTrendPoint[]>(defaultTrend);
  const [refundDist, setRefundDist] = useState<LocalRefundPoint[]>(defaultRefundDist);
  const [ticketRank, setTicketRank] = useState<LocalTicketRank[]>(defaultTicketRank);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary>(defaultPipelineSummary);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          kpiApi.getOverview({ compareMode: 'mom' }),
          kpiApi.getTrend({ granularity: 'day' }),
          refundApi.getDistribution(),
          ticketApi.getRank({ topN: 6 }),
          pipelineApi.getStatus(),
        ]);

        const [ovRes, trendRes, rdRes, trRes, psRes] = results;

        if (ovRes.status === 'fulfilled') {
          const raw = ovRes.value as unknown as Record<string, unknown>;
          setKpiOverview({
            totalTickets: (raw.totalTickets as number) ?? defaultKpi.totalTickets,
            totalRevenue: (raw.totalRevenue as number) ?? defaultKpi.totalRevenue,
            totalCheckins: (raw.totalCheckins as number) ?? defaultKpi.totalCheckins,
            avgTicketPrice: (raw.avgTicketPrice as number) ?? defaultKpi.avgTicketPrice,
            checkinRate: (raw.checkinRate as number) ?? defaultKpi.checkinRate,
            conversionRate: (raw.conversionRate as number) ?? defaultKpi.conversionRate,
            totalSponsorship: (raw.totalSponsorship as number) ?? defaultKpi.totalSponsorship,
            ticketsCompared: (raw.ticketsCompared as number) ?? defaultKpi.ticketsCompared,
            revenueCompared: (raw.revenueCompared as number) ?? defaultKpi.revenueCompared,
            checkinsCompared: (raw.checkinsCompared as number) ?? defaultKpi.checkinsCompared,
          });
        }

        if (trendRes.status === 'fulfilled') {
          const raw = trendRes.value as unknown as Record<string, unknown>[];
          if (raw && raw.length) {
            setKpiTrend(
              raw.map((r) => ({
                date: (r.date as string) ?? '',
                tickets: (r.tickets as number) ?? (r.fulfillmentRate as number) ?? 0,
                revenue: ((r.revenue as number) ?? 0) / 10000 || (r.fulfillmentRate as number) || 0,
                checkins: (r.checkins as number) ?? (r.fulfillmentRate as number) ?? 0,
              })),
            );
          }
        }

        if (rdRes.status === 'fulfilled') {
          const raw = rdRes.value as unknown as Record<string, unknown>[];
          if (raw && raw.length) {
            setRefundDist(
              raw.map((r) => ({
                status: (r.status as string) ?? (r.date as string) ?? '',
                label: (r.label as string) ?? (r.status as string) ?? '',
                count: (r.count as number) ?? (r.refundCount as number) ?? 0,
                amount: (r.amount as number) ?? (r.refundAmount as number) ?? 0,
              })),
            );
          }
        }

        if (trRes.status === 'fulfilled') {
          const raw = trRes.value as unknown as Record<string, unknown>[];
          if (raw && raw.length) {
            const total = raw.reduce((s, r) => s + ((r.sold as number) ?? (r.soldCount as number) ?? 0), 0) || 1;
            const palette = ['#00D4FF', '#8B5CF6', '#00E396', '#FF8A00', '#FF3D57', '#FACC15'];
            setTicketRank(
              raw.map((r, i) => ({
                ticketType: (r.ticketType as string) ?? (r.ruleName as string) ?? `票型${i + 1}`,
                sold: (r.sold as number) ?? (r.soldCount as number) ?? 0,
                revenue: (r.revenue as number) ?? ((r.price as number) ?? 0) * ((r.soldCount as number) ?? 0),
                percentage:
                  (r.percentage as number) ??
                  (((r.sold as number) ?? (r.soldCount as number) ?? 0) / total) * 100,
                color: (r.color as string) ?? palette[i % palette.length],
              })),
            );
          }
        }

        if (psRes.status === 'fulfilled') {
          const raw = psRes.value as unknown as Record<string, unknown> | Record<string, unknown>[];
          if (Array.isArray(raw)) {
            setPipelineSummary({
              pending: raw.length,
              synced: raw.filter((x) => (x.status as string) === 'synced').length,
              verified: raw.filter((x) => (x.status as string) === 'verified').length,
              completed: raw.filter((x) => (x.status as string) === 'completed').length,
              failed: raw.filter((x) => (x.status as string) === 'failed' || (x.status as string) === 'error').length,
            });
          } else if (raw && typeof raw === 'object') {
            setPipelineSummary({
              pending: (raw.pending as number) ?? defaultPipelineSummary.pending,
              synced: (raw.synced as number) ?? defaultPipelineSummary.synced,
              verified: (raw.verified as number) ?? defaultPipelineSummary.verified,
              completed: (raw.completed as number) ?? defaultPipelineSummary.completed,
              failed: (raw.failed as number) ?? defaultPipelineSummary.failed,
            });
          }
        }
      } finally {
        setLoading(false);
        setLastUpdated(dayjs().format('YYYY-MM-DD HH:mm:ss'));
      }
    };
    loadAll();

    const timer = setInterval(loadAll, 30000);
    return () => clearInterval(timer);
  }, []);

  const trendSeries = useMemo(() => {
    const dates = kpiTrend.map((t) => t.date || dayjs().format('MM-DD'));
    const tickets = kpiTrend.map((t) => t.tickets);
    const revenues = kpiTrend.map((t) => t.revenue);
    const checkins = kpiTrend.map((t) => t.checkins);
    return { dates, tickets, revenues, checkins };
  }, [kpiTrend]);

  const riskOption: EChartsOption = useMemo(() => {
    const dates = trendSeries.dates.length
      ? trendSeries.dates
      : Array.from({ length: 14 }, (_, i) => dayjs().subtract(13 - i, 'day').format('MM-DD'));
    const fulfillment = trendSeries.checkins.length
      ? trendSeries.checkins.map((c, i) => {
          const t = trendSeries.tickets[i] || 1;
          return +((c / t) * 100).toFixed(1);
        })
      : [78, 82, 79, 85, 88, 86, 90, 92, 89, 87, 91, 93, 95, 94];
    const warnThreshold = dates.map(() => 80);
    const dangerThreshold = dates.map(() => 70);

    return {
      grid: { left: 50, right: 30, top: 50, bottom: 40, containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(6,18,41,0.95)',
        borderColor: 'rgba(0,212,255,0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        valueFormatter: (v) => (typeof v === 'number' ? `${v}%` : v),
      },
      legend: {
        data: ['权益兑现率', '预警阈值', '危险阈值'],
        textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
        top: 6,
        right: 10,
        itemWidth: 14,
        itemHeight: 8,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 50,
        max: 100,
        axisLabel: {
          color: 'rgba(255,255,255,0.5)',
          fontSize: 11,
          formatter: '{value}%',
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: '危险阈值',
          type: 'line',
          data: dangerThreshold,
          lineStyle: { color: '#FF3D57', type: 'dashed', width: 1.5 },
          itemStyle: { color: '#FF3D57' },
          symbol: 'none',
          z: 1,
        },
        {
          name: '预警阈值',
          type: 'line',
          data: warnThreshold,
          lineStyle: { color: '#FF8A00', type: 'dashed', width: 1.5 },
          itemStyle: { color: '#FF8A00' },
          symbol: 'none',
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255,138,0,0.18)' },
                { offset: 1, color: 'rgba(255,61,87,0.05)' },
              ],
            },
          },
          z: 2,
        },
        {
          name: '权益兑现率',
          type: 'line',
          data: fulfillment,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#00D4FF', width: 2.5 },
          itemStyle: {
            color: '#00D4FF',
            borderColor: '#061229',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0,212,255,0.6)',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0,212,255,0.45)' },
                { offset: 1, color: 'rgba(0,212,255,0.02)' },
              ],
            },
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 38,
            itemStyle: { color: '#FF3D57' },
            label: { color: '#fff', fontSize: 10, fontWeight: 700 },
            data: fulfillment
              .map<{ value: string; xAxis: number; yAxis: number } | null>((v, i) =>
                v < 80 ? { value: `${v}%`, xAxis: i, yAxis: v } : null,
              )
              .filter((v): v is { value: string; xAxis: number; yAxis: number } => v !== null),
          },
          z: 3,
        },
      ],
    } as EChartsOption;
  }, [trendSeries]);

  const refundOption: EChartsOption = useMemo(() => {
    const labels = refundDist.length ? refundDist.map((r) => r.label) : ['待处理', '处理中', '已批准', '已完成', '已拒绝'];
    const counts = refundDist.length ? refundDist.map((r) => r.count) : [128, 56, 342, 890, 45];
    const disputeIdx = 4;

    return {
      grid: { left: 50, right: 20, top: 40, bottom: 40, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(6,18,41,0.95)',
        borderColor: 'rgba(0,212,255,0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        axisLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: counts.map((v, i) => ({
            value: v,
            itemStyle: {
              color:
                i === disputeIdx
                  ? ({
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: '#FF3D57' },
                        { offset: 1, color: 'rgba(255,61,87,0.25)' },
                      ],
                    } as unknown as string)
                  : ({
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: '#00D4FF' },
                        { offset: 1, color: 'rgba(0,212,255,0.14)' },
                      ],
                    } as unknown as string),
              borderRadius: [6, 6, 0, 0] as [number, number, number, number],
              shadowBlur: i === disputeIdx ? 14 : 8,
              shadowColor: i === disputeIdx ? 'rgba(255,61,87,0.45)' : 'rgba(0,212,255,0.3)',
            },
            label: {
              show: true,
              position: 'top' as const,
              color: i === disputeIdx ? '#FF3D57' : '#00F0FF',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Chakra Petch, sans-serif',
            },
          })),
          barWidth: '48%',
          markLine: {
            silent: true,
            symbol: 'none' as const,
            lineStyle: { color: '#FF3D57', type: 'dashed', width: 1.5 },
            label: {
              show: true,
              position: 'end' as const,
              formatter: '争议点警戒线',
              color: '#FF3D57',
              fontSize: 11,
              fontWeight: 600,
            },
            data: [{ yAxis: 80 }],
          },
        },
      ],
    } as EChartsOption;
  }, [refundDist]);

  const pieOption: EChartsOption = useMemo(() => {
    const palette = ['#00D4FF', '#8B5CF6', '#00E396', '#FF8A00', '#FF3D57', '#FACC15'];
    const pieData = ticketRank.length
      ? ticketRank.map((t, i) => ({
          name: t.ticketType,
          value: t.sold,
          percentage: t.percentage,
          itemStyle: { color: t.color || palette[i % palette.length] },
        }))
      : defaultTicketRank.map((t) => ({
          name: t.ticketType,
          value: t.sold,
          percentage: t.percentage,
          itemStyle: { color: t.color },
        }));

    const total = pieData.reduce((s, d) => s + d.value, 0);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(6,18,41,0.95)',
        borderColor: 'rgba(0,212,255,0.3)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        formatter: (params) => {
          const p = params as { name: string; value: number; percent?: number; data?: { percentage?: number } };
          const pct = p.data?.percentage ?? p.percent ?? 0;
          return `<div style="padding:4px 2px"><b>${p.name}</b><br/>数量：${p.value.toLocaleString()} 张<br/>占比：${pct.toFixed(1)}%</div>`;
        },
      },
      legend: {
        orient: 'vertical' as const,
        right: 10,
        top: 'center',
        textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter, sans-serif' },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        formatter: (name: string) => {
          const item = pieData.find((d) => d.name === name);
          const pct = item?.percentage ?? 0;
          return `${name}  ${pct.toFixed(1)}%`;
        },
      },
      graphic: [
        {
          type: 'text' as const,
          left: '28%',
          top: '42%',
          style: {
            text: '票种分布',
            fill: 'rgba(255,255,255,0.5)',
            fontSize: 12,
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
          },
        },
        {
          type: 'text' as const,
          left: '28%',
          top: '52%',
          style: {
            text: total.toLocaleString(),
            fill: '#fff',
            fontSize: 28,
            fontWeight: 700,
            textAlign: 'center',
            fontFamily: 'Chakra Petch, sans-serif',
            textShadow: '0 0 12px rgba(0,212,255,0.5)',
          },
        },
        {
          type: 'text' as const,
          left: '28%',
          top: '62%',
          style: {
            text: '总张数',
            fill: 'rgba(255,255,255,0.4)',
            fontSize: 11,
            textAlign: 'center',
          },
        },
      ],
      series: [
        {
          type: 'pie',
          radius: ['55%', '78%'],
          center: ['30%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#061229',
            borderWidth: 3,
          },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0,212,255,0.5)',
            },
          },
          data: pieData.map((d) => ({
            ...d,
            label: { show: false },
          })),
        },
      ],
    } as EChartsOption;
  }, [ticketRank]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white glow-text tracking-wide">
            营运指挥中心
          </h1>
          <p className="text-white/50 text-sm mt-1">实时数据监控 · 智能预警分析</p>
        </div>
        <div className="flex items-center gap-3">
          <TagChip color="info" pulse size="sm">
            LIVE
          </TagChip>
          <span className="text-white/40 text-xs">最后更新：{lastUpdated}</span>
          <button className="px-3 py-1.5 rounded-lg bg-cyan-primary/15 border border-cyan-primary/40 text-cyan-glow text-xs font-medium hover:bg-cyan-primary/25 transition-all shadow-glow-cyan flex items-center gap-1.5">
            <RefreshCw size={13} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="总售票数"
          value={kpiOverview.totalTickets}
          compareValue={kpiOverview.ticketsCompared}
          icon={Ticket}
          suffix="张"
          trend={trendSeries.tickets.length ? trendSeries.tickets : defaultTrend.map((t) => t.tickets)}
        />
        <KpiCard
          label="总营收"
          value={kpiOverview.totalRevenue}
          compareValue={kpiOverview.revenueCompared}
          icon={DollarSign}
          prefix="¥"
          trend={trendSeries.revenues.length ? trendSeries.revenues : defaultTrend.map((t) => t.revenue)}
        />
        <KpiCard
          label="核验入场"
          value={kpiOverview.totalCheckins}
          compareValue={kpiOverview.checkinsCompared}
          icon={Users}
          suffix="人"
          trend={trendSeries.checkins.length ? trendSeries.checkins : defaultTrend.map((t) => t.checkins)}
        />
        <KpiCard
          label="兑现率"
          value={kpiOverview.checkinRate}
          compareValue={86.2}
          icon={ShieldCheck}
          suffix="%"
          trend={[78, 82, 79, 85, 88, 86, 90, 92, 89, 87, 91, 93, 95, 94]}
        />
        <KpiCard
          label="转化率"
          value={kpiOverview.conversionRate}
          compareValue={11.3}
          icon={TrendingUp}
          suffix="%"
          trend={[8.2, 8.5, 9.1, 9.8, 10.2, 10.5, 11.2, 11.5, 11.8, 12.0, 12.2, 12.4, 12.5, 12.6]}
        />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <ChartCard
          title="权益风险趋势"
          extra={
            <div className="flex items-center gap-2">
              <TagChip color="danger">{'危险 <70%'}</TagChip>
              <TagChip color="warning">{'预警 <80%'}</TagChip>
            </div>
          }
          option={riskOption}
          loading={loading && !trendSeries.dates.length}
          className="col-span-12 lg:col-span-8"
          chartHeight={360}
        />

        <Panel
          title="实时同步链路"
          extra={
            <TagChip color="info" pulse size="sm">
              <Zap size={10} />
              &nbsp;3 路活跃
            </TagChip>
          }
          className="col-span-12 lg:col-span-4"
        >
          <SyncPipelineDiagram status={pipelineSummary} />
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <ChartCard
          title="退票分布"
          extra={<TagChip color="danger">争议点标红</TagChip>}
          option={refundOption}
          loading={loading && !refundDist.length}
          className="col-span-12 lg:col-span-6"
          chartHeight={340}
        />
        <ChartCard
          title="票种占比"
          extra={<TagChip color="purple">{ticketRank.length || 5} 种票型</TagChip>}
          option={pieOption}
          loading={loading && !ticketRank.length}
          className="col-span-12 lg:col-span-6"
          chartHeight={340}
          glow="purple"
        />
      </div>
    </div>
  );
}
