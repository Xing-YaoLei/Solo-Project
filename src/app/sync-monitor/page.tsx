"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SyncPipeline from "@/components/SyncPipeline";
import {
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Store,
  Smartphone,
  Camera,
  Loader2,
} from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface SyncLogItem {
  id: string;
  sourceType: string;
  startTime: string;
  endTime?: string;
  status: string;
  recordCount: number;
  errorMessage?: string;
}

const SOURCE_META: Record<string, { sourceName: string; icon: React.ReactNode; color: string }> = {
  merchant: { sourceName: "商户流水", icon: <Store size={18} />, color: "#06b6d4" },
  miniapp: { sourceName: "小程序订单", icon: <Smartphone size={18} />, color: "#10b981" },
  camera: { sourceName: "摄像头统计", icon: <Camera size={18} />, color: "#f97316" },
};

export default function SyncMonitorPage() {
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Record<string, any[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/sync/logs?pageSize=50${selectedSource !== "all" ? `&sourceType=${selectedSource}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setSyncLogs(data.list || []);
      }
    } catch (e) {
      console.error("Fetch sync logs error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const buildStatuses = () => {
    const types = ["merchant", "miniapp", "camera"];
    return types.map((type) => {
      const meta = SOURCE_META[type];
      const typeLogs = syncLogs.filter((l) => l.sourceType === type);
      const lastSuccess = typeLogs.find((l) => l.status === "success");
      const lastRunning = typeLogs.find((l) => l.status === "running");
      const totalCount = typeLogs.reduce((s, l) => s + (l.recordCount || 0), 0);

      let status: "success" | "running" | "failed" = "success";
      let lastSync = "暂无记录";
      if (lastRunning) {
        status = "running";
        lastSync = "同步中...";
      } else if (lastSuccess) {
        const mins = differenceInMinutes(new Date(), new Date(lastSuccess.startTime));
        lastSync = mins < 1 ? "刚刚" : mins < 60 ? `${mins}分钟前` : format(new Date(lastSuccess.startTime), "HH:mm");
      } else if (typeLogs[0]) {
        status = "failed";
        lastSync = "上次失败";
      }

      return {
        sourceType: type,
        sourceName: meta.sourceName,
        icon: meta.icon,
        status,
        lastSync,
        recordCount: totalCount,
        color: meta.color,
      };
    });
  };

  const handleSync = async (sourceType: string) => {
    if (syncingMap[sourceType]) return;
    setSyncingMap((m) => ({ ...m, [sourceType]: true }));
    try {
      const res = await fetch("/api/sync/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType }),
      });
      if (res.ok) {
        await fetchLogs();
      }
    } catch (e) {
      console.error("Sync trigger error:", e);
    } finally {
      setSyncingMap((m) => ({ ...m, [sourceType]: false }));
    }
  };

  const handleSyncAll = async () => {
    await Promise.all(["merchant", "miniapp", "camera"].map((t) => handleSync(t)));
  };

  const fetchDetails = async (logId: string) => {
    if (details[logId] || loadingDetails[logId]) return;
    setLoadingDetails((m) => ({ ...m, [logId]: true }));
    try {
      const res = await fetch(`/api/sync/logs?logId=${logId}`);
      if (res.ok) {
        const data = await res.json();
        setDetails((d) => ({ ...d, [logId]: data.details || [] }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails((m) => ({ ...m, [logId]: false }));
    }
  };

  const toggleExpand = (logId: string) => {
    const willExpand = expandedLog !== logId;
    setExpandedLog(willExpand ? logId : null);
    if (willExpand) fetchDetails(logId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <span className="badge badge-success flex items-center gap-1 w-fit">
            <CheckCircle size={12} />
            成功
          </span>
        );
      case "running":
        return (
          <span className="badge badge-info flex items-center gap-1 w-fit">
            <RefreshCw size={12} className="animate-spin" />
            进行中
          </span>
        );
      case "failed":
        return (
          <span className="badge badge-error flex items-center gap-1 w-fit">
            <AlertCircle size={12} />
            失败
          </span>
        );
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  const successToday = syncLogs.filter((l) => l.status === "success").length;
  const failedToday = syncLogs.filter((l) => l.status === "failed").length;
  const runningNow = syncLogs.filter((l) => l.status === "running").length;
  const totalRecords = syncLogs.reduce((s, l) => s + (l.recordCount || 0), 0);

  const statuses = buildStatuses();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">
              数据同步监控
            </h2>
            <p className="text-sm text-slate-400">
              实时监控三大数据源同步状态，查看同步日志详情
            </p>
          </div>

          <button
            onClick={handleSyncAll}
            className="btn-primary flex items-center gap-2"
            disabled={Object.values(syncingMap).some(Boolean)}
          >
            <RefreshCw size={16} className={Object.values(syncingMap).some(Boolean) ? "animate-spin" : ""} />
            全部同步
          </button>
        </div>

        <div>
          <h3 className="section-title mb-4">
            <Database size={18} className="text-primary-400" />
            同步链路
          </h3>
          <SyncPipeline
            statuses={statuses.map((s) => ({ ...s, syncing: syncingMap[s.sourceType] || false }))}
            onSyncClick={handleSync}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">今日成功同步</p>
                <p className="text-xl font-mono font-bold text-white">{successToday} 次</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">今日失败次数</p>
                <p className="text-xl font-mono font-bold text-white">{failedToday} 次</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <RefreshCw size={20} className="text-primary-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">同步中</p>
                <p className="text-xl font-mono font-bold text-white">{runningNow} 个</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <FileText size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">累计同步记录</p>
                <p className="text-xl font-mono font-bold text-white">
                  {totalRecords.toLocaleString()} 条
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <Clock size={18} className="text-violet-400" />
              同步日志
            </h3>

            <div className="flex items-center gap-2">
              {[
                { key: "all", label: "全部" },
                { key: "merchant", label: "商户流水" },
                { key: "miniapp", label: "小程序订单" },
                { key: "camera", label: "摄像头统计" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedSource(item.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    selectedSource === item.key
                      ? "bg-primary-500/20 text-primary-400"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs.length === 0 ? (
                <p className="text-center py-12 text-sm text-slate-500">暂无同步日志</p>
              ) : (
                syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-white/5 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 bg-dark-800/30 hover:bg-dark-800/50 cursor-pointer transition-colors"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-center gap-4">
                        {getStatusBadge(log.status)}
                        <span className="text-sm text-slate-300">
                          {SOURCE_META[log.sourceType]?.sourceName || log.sourceType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(log.startTime), "HH:mm:ss")}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">同步记录</p>
                          <p className="text-sm font-mono text-white">
                            {log.recordCount.toLocaleString()} 条
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">耗时</p>
                          <p className="text-sm font-mono text-slate-300">
                            {log.endTime
                              ? `${Math.max(
                                  1,
                                  Math.round(
                                    (new Date(log.endTime).getTime() -
                                      new Date(log.startTime).getTime()) /
                                      1000
                                  )
                                )}秒`
                              : "-"}
                          </p>
                        </div>
                        {expandedLog === log.id ? (
                          <ChevronUp size={18} className="text-slate-500" />
                        ) : (
                          <ChevronDown size={18} className="text-slate-500" />
                        )}
                      </div>
                    </div>

                    {expandedLog === log.id && (
                      <div className="p-4 bg-dark-900/50 border-t border-white/5">
                        {log.errorMessage && (
                          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-sm text-red-400">
                              <AlertCircle size={14} className="inline mr-2" />
                              {log.errorMessage}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 mb-1">开始时间</p>
                            <p className="text-slate-300 font-mono">
                              {format(
                                new Date(log.startTime),
                                "yyyy-MM-dd HH:mm:ss"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">结束时间</p>
                            <p className="text-slate-300 font-mono">
                              {log.endTime
                                ? format(
                                    new Date(log.endTime),
                                    "yyyy-MM-dd HH:mm:ss"
                                  )
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 mb-1">同步数量</p>
                            <p className="text-slate-300 font-mono">
                              {log.recordCount.toLocaleString()} 条
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-xs text-slate-500 mb-2">同步明细</p>
                          {loadingDetails[log.id] ? (
                            <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                              <Loader2 size={12} className="animate-spin" />
                              加载中...
                            </div>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(details[log.id] || []).length === 0 ? (
                                <p className="text-xs text-slate-500 py-2">暂无明细</p>
                              ) : (
                                (details[log.id] || []).slice(0, 20).map((d: any, i: number) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-3 text-xs py-1"
                                  >
                                    <span className={`${d.operation === "INSERT" ? "text-emerald-400" : "text-primary-400"}`}>
                                      {d.operation}
                                    </span>
                                    <span className="text-slate-500 font-mono">
                                      {d.recordId}
                                    </span>
                                    <span className="text-slate-400 truncate flex-1">
                                      {d.message}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
