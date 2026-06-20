import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Ticket,
  Users,
  Sparkles,
  Copy,
  Check,
  Filter,
  Search,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight,
} from 'lucide-react';
import dayjs from 'dayjs';
import Panel from '@/components/common/Panel';
import TagChip from '@/components/common/TagChip';
import { pipelineApi } from '@/api/modules/pipeline';
import { cn } from '@/lib/utils';

type PipelineTaskStatus = 'running' | 'success' | 'error' | 'idle';

interface PipelineTask {
  id: string;
  name: string;
  source: string;
  icon: typeof Ticket;
  status: PipelineTaskStatus;
  lastSync: string;
  records: number;
  delay: number;
  description: string;
}

const defaultTasks: PipelineTask[] = [
  {
    id: 'ticket-sync',
    name: '票务数据同步',
    source: 'ticket',
    icon: Ticket,
    status: 'success',
    lastSync: dayjs().subtract(3, 'minute').toISOString(),
    records: 12847,
    delay: 2.4,
    description: '从票务主系统拉取订单、核销、退款记录',
  },
  {
    id: 'verification-sync',
    name: '核验终端同步',
    source: 'verification',
    icon: Users,
    status: 'running',
    lastSync: dayjs().subtract(45, 'second').toISOString(),
    records: 624,
    delay: 0.8,
    description: '闸机核验设备实时上报入场记录',
  },
  {
    id: 'sponsorship-sync',
    name: '赞助权益同步',
    source: 'sponsorship',
    icon: Sparkles,
    status: 'error',
    lastSync: dayjs().subtract(1, 'hour').toISOString(),
    records: 86,
    delay: 45.2,
    description: 'CRM 赞助合同与权益兑现进度同步',
  },
];

const statusMap: Record<
  PipelineTaskStatus,
  { label: string; color: 'success' | 'info' | 'danger' | 'purple'; dot: string }
> = {
  running: { label: '同步中', color: 'info', dot: '#00D4FF' },
  success: { label: '已完成', color: 'success', dot: '#00E396' },
  error: { label: '异常', color: 'danger', dot: '#FF3D57' },
  idle: { label: '空闲', color: 'purple', dot: '#8B5CF6' },
};

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
type LogStatus = 'success' | 'pending' | 'failed';

interface LogRow {
  id: string;
  source: string;
  status: LogStatus;
  recordsSynced: number;
  syncTime: string;
  duration?: number;
  message?: string;
  level: LogLevel;
  detail: Record<string, unknown>;
}

interface PipelineOverview {
  pending: number;
  synced: number;
  verified: number;
  completed: number;
  failed: number;
}

const mockLogs: LogRow[] = [
  {
    id: 'log-001',
    source: 'ticket',
    status: 'success',
    recordsSynced: 1284,
    syncTime: dayjs().subtract(3, 'minute').toISOString(),
    duration: 2.4,
    message: '票务增量同步完成',
    level: 'INFO',
    detail: {
      batchId: 'BATCH-20250621-0142',
      inserts: 1156,
      updates: 128,
      deletes: 0,
      sourceSystem: 'TICKET-MAIN-v3.2',
      correlationId: 'cid-8f3a9c2e',
      checksum: 'a1b2c3d4e5f67890',
    },
  },
  {
    id: 'log-002',
    source: 'verification',
    status: 'success',
    recordsSynced: 624,
    syncTime: dayjs().subtract(45, 'second').toISOString(),
    duration: 0.8,
    message: '核验数据实时推送',
    level: 'INFO',
    detail: {
      deviceCount: 12,
      gateIds: ['G-A01', 'G-A02', 'G-B01', 'G-B02'],
      avgLatencyMs: 128,
      peakQps: 42,
      duplicates: 2,
    },
  },
  {
    id: 'log-003',
    source: 'sponsorship',
    status: 'failed',
    recordsSynced: 0,
    syncTime: dayjs().subtract(1, 'hour').toISOString(),
    duration: 45.2,
    message: '赞助系统连接超时，重试 3 次失败',
    level: 'ERROR',
    detail: {
      error: 'ETIMEDOUT',
      endpoint: 'https://crm.internal/sponsor/api/v2/sync',
      attempts: 3,
      lastResponse: { status: 504, body: 'Gateway Timeout' },
      retrySchedule: [0, 5000, 15000],
      suggestion: '检查网络连通性或联系 CRM 运维',
    },
  },
  {
    id: 'log-004',
    source: 'ticket',
    status: 'pending',
    recordsSynced: 0,
    syncTime: dayjs().subtract(12, 'minute').toISOString(),
    duration: 0,
    message: '检测到退票高峰，触发额外全量同步任务',
    level: 'WARN',
    detail: {
      trigger: 'refund_spike_detector',
      threshold: 50,
      currentRefundRate: 67,
      estimatedVolume: 320,
      eta: '5分钟后执行',
    },
  },
  {
    id: 'log-005',
    source: 'verification',
    status: 'success',
    recordsSynced: 156,
    syncTime: dayjs().subtract(8, 'minute').toISOString(),
    duration: 1.2,
    message: 'VIP 区域核验规则更新',
    level: 'DEBUG',
    detail: {
      ruleVersion: 'v2.3.1',
      affectedAreas: ['VIP-A', 'VIP-B', 'SUITE-1~12'],
      newBlacklist: 0,
      newWhitelist: 12,
    },
  },
  {
    id: 'log-006',
    source: 'ticket',
    status: 'success',
    recordsSynced: 2847,
    syncTime: dayjs().subtract(33, 'minute').toISOString(),
    duration: 5.8,
    message: '票种销售数据聚合同步',
    level: 'INFO',
    detail: {
      aggregation: '15min_window',
      topTicketType: '普通票',
      revenue: 1284700,
      conversionRate: 12.4,
    },
  },
  {
    id: 'log-007',
    source: 'sponsorship',
    status: 'success',
    recordsSynced: 42,
    syncTime: dayjs().subtract(2, 'hour').toISOString(),
    duration: 3.1,
    message: '赞助权益清单同步',
    level: 'INFO',
    detail: {
      platinum: 2,
      gold: 5,
      silver: 12,
      bronze: 18,
      partner: 5,
    },
  },
];

const defaultOverview: PipelineOverview = {
  pending: 128,
  synced: 2840,
  verified: 2560,
  completed: 2400,
  failed: 7,
};

function formatDuration(sec: number) {
  if (sec < 60) return `${sec.toFixed(1)} 秒`;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(0);
  return `${m}分${s}秒`;
}

function PipelineCard({
  task,
  onTrigger,
  triggering,
}: {
  task: PipelineTask;
  onTrigger: (source: string) => void;
  triggering: boolean;
}) {
  const st = statusMap[task.status];
  const Icon = task.icon;
  const delayColor =
    task.delay < 3
      ? 'text-green-success'
      : task.delay < 10
        ? 'text-orange-warning'
        : 'text-red-danger';

  return (
    <Panel
      className="relative group hover:shadow-glow-cyan transition-all duration-300"
      glow={task.status === 'error' ? 'none' : task.status === 'running' ? 'cyan' : 'none'}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${st.dot}25 0%, ${st.dot}08 100%)`,
              border: `1px solid ${st.dot}40`,
              boxShadow: `0 0 14px ${st.dot}25`,
            }}
          >
            <Icon size={20} style={{ color: st.dot }} strokeWidth={2} />
          </div>
          <div>
            <div className="font-display font-semibold text-white text-base">{task.name}</div>
            <div className="text-white/40 text-xs mt-0.5 max-w-[220px] truncate">
              {task.description}
            </div>
          </div>
        </div>
        <TagChip color={st.color} pulse={task.status === 'running'} size="sm">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: st.dot, boxShadow: `0 0 6px ${st.dot}` }}
          />
          <span className="ml-1">{st.label}</span>
        </TagChip>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg bg-ocean-dark/50 border border-panel-border/30 px-3 py-2.5">
          <div className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
            <Clock size={10} />
            最近同步
          </div>
          <div className="font-display text-sm text-white mt-1 tabular-nums">
            {dayjs(task.lastSync).format('HH:mm:ss')}
          </div>
        </div>
        <div className="rounded-lg bg-ocean-dark/50 border border-panel-border/30 px-3 py-2.5">
          <div className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
            <Database size={10} />
            记录数
          </div>
          <div className="font-display text-sm text-white mt-1 tabular-nums">
            {task.records.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-ocean-dark/50 border border-panel-border/30 px-3 py-2.5">
          <div className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1">
            <Clock size={10} />
            延迟
          </div>
          <div className={cn('font-display text-sm mt-1 tabular-nums', delayColor)}>
            {task.delay.toFixed(1)}s
          </div>
        </div>
      </div>

      <button
        onClick={() => onTrigger(task.source)}
        disabled={triggering || task.status === 'running'}
        className={cn(
          'w-full h-9 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all duration-200',
          triggering || task.status === 'running'
            ? 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            : 'bg-cyan-primary/15 border border-cyan-primary/40 text-cyan-glow hover:bg-cyan-primary/25 hover:shadow-glow-cyan',
        )}
      >
        {triggering ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            正在触发...
          </>
        ) : task.status === 'running' ? (
          <>
            <RefreshCw size={13} className="animate-spin" />
            执行中
          </>
        ) : (
          <>
            <Play size={13} />
            手动触发同步
          </>
        )}
      </button>
    </Panel>
  );
}

const sourceLabels: Record<string, string> = {
  ticket: '票务系统',
  verification: '核验终端',
  sponsorship: '赞助平台',
  all: '全部任务',
};

export default function PipelinePage() {
  const [tasks, setTasks] = useState<PipelineTask[]>(defaultTasks);
  const [logs, setLogs] = useState<LogRow[]>(mockLogs);
  const [overview, setOverview] = useState<PipelineOverview>(defaultOverview);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const raw = (await pipelineApi.getStatus()) as unknown as
          | Record<string, unknown>
          | Record<string, unknown>[];
        if (Array.isArray(raw)) {
          setOverview({
            pending: raw.length,
            synced: raw.filter((x) => (x.status as string) === 'synced').length,
            verified: raw.filter((x) => (x.status as string) === 'verified').length,
            completed: raw.filter((x) => (x.status as string) === 'completed').length,
            failed: raw.filter(
              (x) => (x.status as string) === 'failed' || (x.status as string) === 'error',
            ).length,
          });
        } else if (raw && typeof raw === 'object') {
          setOverview({
            pending: (raw.pending as number) ?? defaultOverview.pending,
            synced: (raw.synced as number) ?? defaultOverview.synced,
            verified: (raw.verified as number) ?? defaultOverview.verified,
            completed: (raw.completed as number) ?? defaultOverview.completed,
            failed: (raw.failed as number) ?? defaultOverview.failed,
          });
        }
      } catch {
        /* use default overview */
      }

      try {
        const logRes = (await pipelineApi.getSyncLogs({
          page: 1,
          pageSize: 20,
        })) as unknown as {
          items?: Record<string, unknown>[];
          list?: Record<string, unknown>[];
        };
        const arr = logRes.items || logRes.list;
        if (arr && arr.length) {
          const mapped: LogRow[] = arr.map((r, idx) => {
            const detailStr = (r.detail as string) ?? '{}';
            let parsedDetail: Record<string, unknown>;
            try {
              parsedDetail = JSON.parse(detailStr);
            } catch {
              parsedDetail = { raw: detailStr };
            }
            const lvl = ((r.level as string) || 'INFO').toUpperCase() as LogLevel;
            const validLevel: LogLevel =
              lvl === 'INFO' || lvl === 'WARN' || lvl === 'ERROR' || lvl === 'DEBUG' ? lvl : 'INFO';
            const st = (r.status as string) || 'success';
            const validStatus: LogStatus =
              st === 'success' || st === 'pending' || st === 'failed' ? st : 'success';
            return {
              id: (r.id as string) ?? `log-api-${idx}`,
              source: (r.source as string) ?? (r.taskCode as string) ?? 'ticket',
              status: validStatus,
              recordsSynced: (r.recordsSynced as number) ?? (r.lastSyncCount as number) ?? 0,
              syncTime:
                (r.syncTime as string) ?? (r.createdAt as string) ?? new Date().toISOString(),
              duration: (r.duration as number) ?? undefined,
              message: (r.message as string) ?? undefined,
              level: validLevel,
              detail: parsedDetail,
            };
          });
          setLogs(mapped.concat(mockLogs).slice(0, 30));
        }
      } catch {
        /* use mock logs */
      }
    };
    fetchStatus();
  }, []);

  const handleTrigger = useCallback(async (source: string) => {
    setTriggeringId(source);
    try {
      const res = (await pipelineApi.triggerSync(source)) as unknown as Record<string, unknown>;
      setTasks((prev) =>
        prev.map((t) =>
          t.source === source
            ? {
                ...t,
                status: 'running' as const,
                lastSync:
                  (res.syncTime as string) ||
                  (res.createdAt as string) ||
                  new Date().toISOString(),
              }
            : t,
        ),
      );
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) =>
            t.source === source
              ? {
                  ...t,
                  status: 'success' as const,
                  records: t.records + ((res.recordsSynced as number) ?? 42),
                  lastSync: new Date().toISOString(),
                  delay: 1.0 + Math.random() * 2,
                }
              : t,
          ),
        );
      }, 2500);
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.source === source ? { ...t, status: 'error' as const } : t)),
      );
    } finally {
      setTimeout(() => setTriggeringId(null), 2600);
    }
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (levelFilter !== 'ALL' && l.level !== levelFilter) return false;
      return true;
    });
  }, [logs, sourceFilter, levelFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyDetail = async (id: string, detail: Record<string, unknown>) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(detail, null, 2));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* noop */
    }
  };

  const levelStyle: Record<LogLevel, { bg: string; border: string; text: string }> = {
    INFO: { bg: 'bg-cyan-primary/15', border: 'border-cyan-primary/40', text: 'text-cyan-glow' },
    WARN: {
      bg: 'bg-orange-warning/15',
      border: 'border-orange-warning/40',
      text: 'text-orange-warning',
    },
    ERROR: { bg: 'bg-red-danger/15', border: 'border-red-danger/40', text: 'text-red-danger' },
    DEBUG: {
      bg: 'bg-purple-sponsor/15',
      border: 'border-purple-sponsor/40',
      text: 'text-purple-sponsor',
    },
  };

  const statusStyle: Record<LogStatus, { label: string; color: 'success' | 'warning' | 'danger' }> = {
    success: { label: '成功', color: 'success' },
    pending: { label: '待处理', color: 'warning' },
    failed: { label: '失败', color: 'danger' },
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white glow-text tracking-wide">
            同步管线管理
          </h1>
          <p className="text-white/50 text-sm mt-1">
            多数据源实时同步监控 · 日志可追溯 · 一键手动触发
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-green-success" />
            <span className="text-white/60">已完成</span>
            <span className="font-display font-bold text-white tabular-nums">
              {overview.completed}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Loader2 size={14} className="text-cyan-glow animate-spin" />
            <span className="text-white/60">进行中</span>
            <span className="font-display font-bold text-white tabular-nums">{overview.synced}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle size={14} className="text-red-danger" />
            <span className="text-white/60">失败</span>
            <span className="font-display font-bold text-white tabular-nums">{overview.failed}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <PipelineCard
            key={task.id}
            task={task}
            onTrigger={handleTrigger}
            triggering={triggeringId === task.source}
          />
        ))}
      </div>

      <Panel
        title="同步日志"
        extra={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                placeholder="搜索日志..."
                className="h-8 w-44 pl-8 pr-3 rounded-lg bg-ocean-dark/60 border border-panel-border/50 text-white text-xs placeholder:text-white/30 focus:border-cyan-primary/60 focus:outline-none transition-colors"
              />
            </div>
            <button className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10 flex items-center gap-1.5">
              <RefreshCw size={12} />
              刷新
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-panel-border/40">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-white/40" />
            <span className="text-xs text-white/50">任务：</span>
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'ticket', 'verification', 'sponsorship'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSourceFilter(s);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                    sourceFilter === s
                      ? 'bg-cyan-primary/20 border-cyan-primary/50 text-cyan-glow shadow-glow-cyan'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80',
                  )}
                >
                  {sourceLabels[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-white/50">级别：</span>
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLevelFilter(l);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                    levelFilter === l
                      ? l === 'ALL'
                        ? 'bg-cyan-primary/20 border-cyan-primary/50 text-cyan-glow shadow-glow-cyan'
                        : `${levelStyle[l as LogLevel].bg} ${levelStyle[l as LogLevel].border} ${levelStyle[l as LogLevel].text}`
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80',
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-panel-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ocean-dark/70 text-white/50 text-xs">
                <th className="w-8"></th>
                <th className="text-left font-medium py-3 px-4">时间</th>
                <th className="text-left font-medium py-3 px-4">任务</th>
                <th className="text-left font-medium py-3 px-4">级别</th>
                <th className="text-left font-medium py-3 px-4">状态</th>
                <th className="text-right font-medium py-3 px-4">记录数</th>
                <th className="text-right font-medium py-3 px-4">耗时</th>
                <th className="text-left font-medium py-3 px-4">消息</th>
              </tr>
            </thead>
            <tbody>
              {pagedLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-white/40">
                    暂无符合条件的日志
                  </td>
                </tr>
              )}
              {pagedLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const ls = levelStyle[log.level];
                const ss = statusStyle[log.status];
                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className={cn(
                        'border-t border-panel-border/30 cursor-pointer transition-colors',
                        isExpanded ? 'bg-cyan-primary/5' : 'hover:bg-white/[0.03]',
                      )}
                    >
                      <td className="py-3 px-2 text-center">
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-cyan-glow mx-auto" />
                        ) : (
                          <ChevronRight size={14} className="text-white/40 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-white/70 tabular-nums whitespace-nowrap">
                        {dayjs(log.syncTime).format('YYYY-MM-DD HH:mm:ss')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-white/80 text-xs font-medium">
                          {sourceLabels[log.source] || log.source}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                            ls.bg,
                            ls.border,
                            ls.text,
                          )}
                        >
                          {log.level}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <TagChip color={ss.color} size="sm">
                          {ss.label}
                        </TagChip>
                      </td>
                      <td className="py-3 px-4 text-right font-display font-semibold text-white tabular-nums">
                        {log.recordsSynced.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-white/70 tabular-nums text-xs">
                        {log.duration ? formatDuration(log.duration) : '-'}
                      </td>
                      <td className="py-3 px-4 text-white/75 text-xs max-w-[360px] truncate">
                        {log.message}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-ocean-dark/50 border-t border-panel-border/20 animate-slide-in-right">
                        <td colSpan={8} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/50 font-medium tracking-wider uppercase">
                              详细数据 / Detail JSON
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyDetail(log.id, log.detail);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border border-white/10 bg-white/5 text-white/60 hover:text-white/80 hover:border-white/20 transition-colors"
                            >
                              {copiedId === log.id ? (
                                <>
                                  <Check size={12} className="text-green-success" />
                                  <span className="text-green-success">已复制</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  复制 JSON
                                </>
                              )}
                            </button>
                          </div>
                          <div className="rounded-lg overflow-hidden border border-panel-border/50 bg-ocean-dark/90">
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border-b border-panel-border/30">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-danger/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-orange-warning/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-green-success/80" />
                              <span className="ml-2 text-[10px] text-white/30 font-mono">
                                detail · {log.id}.json
                              </span>
                            </div>
                            <pre className="p-4 text-xs font-mono text-left overflow-x-auto leading-relaxed">
                              <code
                                dangerouslySetInnerHTML={{
                                  __html: JSON.stringify(log.detail, null, 2)
                                    .replace(/"([^"]+)":/g, '<span style="color:#FF8A00">"$1"</span>:')
                                    .replace(/: "([^"]*)"/g, ': <span style="color:#00E396">"$1"</span>')
                                    .replace(/: (\d+\.?\d*)/g, ': <span style="color:#00D4FF">$1</span>')
                                    .replace(
                                      /: (true|false)/g,
                                      ': <span style="color:#8B5CF6">$1</span>',
                                    )
                                    .replace(/: (null)/g, ': <span style="color:#FF3D57">$1</span>'),
                                }}
                              />
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-panel-border/40">
          <div className="text-xs text-white/50">
            共{' '}
            <span className="font-display text-white/80 font-semibold">{filteredLogs.length}</span>{' '}
            条日志
            <span className="mx-2 text-white/20">·</span>
            第 <span className="font-display text-white/80 font-semibold">{currentPage}</span> /{' '}
            {totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-md flex items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-md flex items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && Math.abs(p - currentPage) > 1 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) {
                  return (
                    <span key={p} className="w-8 text-center text-white/30 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-md text-xs font-display font-semibold transition-all border',
                    p === currentPage
                      ? 'bg-cyan-primary/20 border-cyan-primary/50 text-cyan-glow shadow-glow-cyan'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20',
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-md flex items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon size={14} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-md flex items-center justify-center border border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
