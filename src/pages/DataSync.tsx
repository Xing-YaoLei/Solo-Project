import { useState, useEffect } from 'react';
import { getTopology, getSyncTasks, getSyncBatches, triggerSyncTask, rerunBatch } from '@/api';
import type { SyncTask, SyncBatch } from '@/types';

const NODE_TYPE_STYLE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  source: { bg: 'bg-orange-400/10', border: 'border-orange-400/30', text: 'text-orange-400', icon: '📥' },
  process: { bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', text: 'text-cyan-400', icon: '⚙️' },
  storage: { bg: 'bg-purple-400/10', border: 'border-purple-400/30', text: 'text-purple-400', icon: '💾' },
  output: { bg: 'bg-green-400/10', border: 'border-green-400/30', text: 'text-green-400', icon: '📊' },
};

const SOURCE_TABS = [
  { key: '', label: '全部' },
  { key: 'ticket_platform', label: '票务' },
  { key: 'gate_system', label: '闸机' },
  { key: 'payment_system', label: '支付' },
];

const SOURCE_LABEL: Record<string, string> = {
  ticket_platform: '票务平台',
  gate_system: '闸机系统',
  payment_system: '支付系统',
};

const BATCH_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-slate-400/15 text-slate-400',
  running: 'bg-cyan-400/15 text-cyan-400 animate-pulse',
  success: 'bg-green-400/15 text-green-400',
  failed: 'bg-red-400/15 text-red-400',
};

const BATCH_STATUS_LABEL: Record<string, string> = {
  pending: '等待中',
  running: '运行中',
  success: '成功',
  failed: '失败',
};

const TASK_STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-400/15 text-green-400',
  paused: 'bg-yellow-400/15 text-yellow-400',
  error: 'bg-red-400/15 text-red-400',
};

const TASK_STATUS_LABEL: Record<string, string> = {
  active: '运行中',
  paused: '已暂停',
  error: '异常',
};

export default function DataSync() {
  const [nodes, setNodes] = useState<{ id: string; name?: string; label?: string; type: string }[]>([]);
  const [edges, setEdges] = useState<{ source: string; target: string }[]>([]);
  const [topologyLoading, setTopologyLoading] = useState(true);
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [batches, setBatches] = useState<SyncBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('');
  const [batchPage, setBatchPage] = useState(1);
  const batchSize = 10;
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  useEffect(() => {
    getTopology()
      .then((res) => {
        setNodes(res.data?.nodes ?? []);
        setEdges(res.data?.edges ?? []);
      })
      .catch(() => {
        setNodes([]);
        setEdges([]);
      })
      .finally(() => setTopologyLoading(false));
  }, []);

  useEffect(() => {
    getSyncTasks()
      .then((res) => setTasks(res.data ?? []))
      .catch(() => setTasks([]))
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => {
    setBatchesLoading(true);
    getSyncBatches({ source: sourceFilter || undefined })
      .then((res) => setBatches(res.data ?? []))
      .catch(() => setBatches([]))
      .finally(() => setBatchesLoading(false));
  }, [sourceFilter]);

  const handleTrigger = async (taskId: string) => {
    setTriggeringId(taskId);
    try {
      await triggerSyncTask(taskId);
      const res = await getSyncTasks();
      setTasks(res.data ?? []);
    } finally {
      setTriggeringId(null);
    }
  };

  const handleRerun = async (batchId: string) => {
    setRerunningId(batchId);
    try {
      await rerunBatch(batchId);
      const res = await getSyncBatches({ source: sourceFilter || undefined });
      setBatches(res.data ?? []);
    } finally {
      setRerunningId(null);
    }
  };

  const LAYER_ORDER = ['source', 'process', 'storage', 'analytics', 'output'];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const layers = LAYER_ORDER.map((type) => nodes.filter((n) => n.type === type));
  const edgeLabels = new Map(edges.map((e) => [`${e.source}->${e.target}`, (e as { source: string; target: string; label?: string }).label]));

  const renderArrow = (delay: number) => (
    <div className="relative mx-3 flex items-center">
      <div className="h-0.5 w-10 bg-gradient-to-r from-white/20 to-white/10" />
      <div
        className="absolute left-0 top-1/2 h-0.5 w-10 -translate-y-1/2 bg-gradient-to-r from-cyan-400/60 to-transparent"
        style={{
          animation: 'pulse-arrow 2s ease-in-out infinite',
          animationDelay: `${delay * 0.3}s`,
        }}
      />
      <svg
        className="absolute -right-1 top-1/2 -translate-y-1/2 text-white/30"
        width="8"
        height="12"
        viewBox="0 0 8 12"
      >
        <path d="M0 0L8 6L0 12Z" fill="currentColor" />
      </svg>
    </div>
  );
  const totalBatchPages = Math.ceil(batches.length / batchSize);
  const paginatedBatches = batches.slice(
    (batchPage - 1) * batchSize,
    batchPage * batchSize
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-slate-100">数据同步</h1>

      <div className="glass-card rounded-xl border border-white/5 p-6">
        <h2 className="font-display mb-4 text-lg font-semibold text-slate-100">
          数据管道拓扑
        </h2>
        {topologyLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : (
          <div className="flex items-center justify-center overflow-x-auto py-4">
            {layers.map((layer, li) => (
              <div key={li} className="flex items-center">
                <div className="flex flex-col items-center gap-3">
                  {layer.map((node) => {
                    const style = NODE_TYPE_STYLE[node.type] ?? NODE_TYPE_STYLE.process;
                    return (
                      <div
                        key={node.id}
                        className={`flex min-w-[120px] flex-col items-center gap-1.5 rounded-xl border px-5 py-3 ${style.bg} ${style.border} transition-all hover:scale-105`}
                      >
                        <span className="text-xl">{style.icon}</span>
                        <span className={`text-center text-xs font-medium ${style.text}`}>
                          {node.name ?? node.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {li < layers.length - 1 && renderArrow(li)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-100">同步任务</h2>
          {tasksLoading ? (
            <div className="glass-card flex h-40 items-center justify-center rounded-xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.taskId}
                  className="glass-card flex items-center justify-between rounded-xl border border-white/5 p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{task.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_BADGE[task.status]}`}
                      >
                        {TASK_STATUS_LABEL[task.status]}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>来源: {task.source}</span>
                      <span className="font-mono">Cron: {task.cronExpression}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-500">
                      {task.lastRunTime && <span>上次: {task.lastRunTime}</span>}
                      <span>下次: {task.nextRunTime}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTrigger(task.taskId)}
                    disabled={triggeringId === task.taskId}
                    className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-sm text-cyan-400 transition-colors hover:bg-cyan-400/20 disabled:opacity-50"
                  >
                    {triggeringId === task.taskId ? '执行中…' : '触发'}
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="py-8 text-center text-slate-500">暂无同步任务</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-100">同步批次</h2>
            <div className="flex gap-1">
              {SOURCE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSourceFilter(tab.key);
                    setBatchPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    sourceFilter === tab.key
                      ? 'bg-cyan-400/15 text-cyan-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {batchesLoading ? (
            <div className="glass-card flex h-40 items-center justify-center rounded-xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            </div>
          ) : (
            <div className="glass-card overflow-hidden rounded-xl border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-slate-400">
                      <th className="px-3 py-2.5 font-medium">批次ID</th>
                      <th className="px-3 py-2.5 font-medium">数据源</th>
                      <th className="px-3 py-2.5 font-medium">状态</th>
                      <th className="px-3 py-2.5 font-medium">进度</th>
                      <th className="px-3 py-2.5 font-medium">时间</th>
                      <th className="px-3 py-2.5 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBatches.map((b) => (
                      <tr
                        key={b.batchId}
                        className="border-b border-white/5 text-slate-300"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs">{b.batchId}</td>
                        <td className="px-3 py-2.5 text-xs">{SOURCE_LABEL[b.source] ?? b.source}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${BATCH_STATUS_BADGE[b.status]}`}
                          >
                            {BATCH_STATUS_LABEL[b.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          <span className="text-slate-200">{b.processedRecords}</span>
                          <span className="text-slate-500">/{b.totalRecords}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">
                          <div>{b.startTime}</div>
                          {b.endTime && <div className="text-slate-500">{b.endTime}</div>}
                          {b.errorMessage && (
                            <div className="mt-0.5 text-red-400">{b.errorMessage}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {b.status === 'failed' && (
                            <button
                              onClick={() => handleRerun(b.batchId)}
                              disabled={rerunningId === b.batchId}
                              className="rounded border border-orange-400/30 bg-orange-400/10 px-2 py-0.5 text-xs text-orange-400 transition-colors hover:bg-orange-400/20 disabled:opacity-50"
                            >
                              {rerunningId === b.batchId ? '重跑中…' : '重跑'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {paginatedBatches.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                          暂无批次记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalBatchPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/5 px-3 py-2.5">
                  <span className="text-xs text-slate-400">
                    {batches.length} 条 · 第 {batchPage}/{totalBatchPages} 页
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBatchPage((p) => Math.max(1, p - 1))}
                      disabled={batchPage <= 1}
                      className="rounded bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setBatchPage((p) => Math.min(totalBatchPages, p + 1))}
                      disabled={batchPage >= totalBatchPages}
                      className="rounded bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-arrow {
          0%, 100% { opacity: 0.3; transform: translateY(-50%) scaleX(0.6); }
          50% { opacity: 1; transform: translateY(-50%) scaleX(1); }
        }
      `}</style>
    </div>
  );
}
