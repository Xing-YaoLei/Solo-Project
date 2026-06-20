"use client";

import { useState } from "react";
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
} from "lucide-react";
import { format, subHours } from "date-fns";

interface SyncLog {
  id: string;
  sourceType: string;
  sourceName: string;
  startTime: string;
  endTime?: string;
  status: string;
  recordCount: number;
  errorMessage?: string;
}

export default function SyncMonitorPage() {
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const syncStatuses: {
    sourceType: string;
    sourceName: string;
    icon: React.ReactNode;
    status: "success" | "running" | "failed";
    lastSync: string;
    recordCount: number;
    color: string;
  }[] = [
    {
      sourceType: "merchant",
      sourceName: "商户流水",
      icon: null,
      status: "success",
      lastSync: "5分钟前",
      recordCount: 12456,
      color: "",
    },
    {
      sourceType: "miniapp",
      sourceName: "小程序订单",
      icon: null,
      status: "success",
      lastSync: "3分钟前",
      recordCount: 8932,
      color: "",
    },
    {
      sourceType: "camera",
      sourceName: "摄像头统计",
      icon: null,
      status: "running",
      lastSync: "同步中...",
      recordCount: 34250,
      color: "",
    },
  ];

  const syncLogs: SyncLog[] = [
    {
      id: "log-1",
      sourceType: "merchant",
      sourceName: "商户流水",
      startTime: subHours(new Date(), 1).toISOString(),
      endTime: subHours(new Date(), 0.8).toISOString(),
      status: "success",
      recordCount: 256,
    },
    {
      id: "log-2",
      sourceType: "miniapp",
      sourceName: "小程序订单",
      startTime: subHours(new Date(), 0.5).toISOString(),
      endTime: subHours(new Date(), 0.4).toISOString(),
      status: "success",
      recordCount: 189,
    },
    {
      id: "log-3",
      sourceType: "camera",
      sourceName: "摄像头统计",
      startTime: subHours(new Date(), 0.25).toISOString(),
      status: "running",
      recordCount: 0,
    },
    {
      id: "log-4",
      sourceType: "merchant",
      sourceName: "商户流水",
      startTime: subHours(new Date(), 2).toISOString(),
      endTime: subHours(new Date(), 1.7).toISOString(),
      status: "success",
      recordCount: 312,
    },
    {
      id: "log-5",
      sourceType: "miniapp",
      sourceName: "小程序订单",
      startTime: subHours(new Date(), 3).toISOString(),
      endTime: subHours(new Date(), 2.9).toISOString(),
      status: "failed",
      recordCount: 0,
      errorMessage: "API连接超时，请检查网络连接",
    },
    {
      id: "log-6",
      sourceType: "camera",
      sourceName: "摄像头统计",
      startTime: subHours(new Date(), 4).toISOString(),
      endTime: subHours(new Date(), 3.5).toISOString(),
      status: "success",
      recordCount: 1540,
    },
  ];

  const filteredLogs = selectedSource === "all"
    ? syncLogs
    : syncLogs.filter((log) => log.sourceType === selectedSource);

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

  const handleSync = (sourceType: string) => {
    alert(`正在触发 ${sourceType} 同步...`);
  };

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

          <button className="btn-primary flex items-center gap-2">
            <RefreshCw size={16} />
            全部同步
          </button>
        </div>

        <div>
          <h3 className="section-title mb-4">
            <Database size={18} className="text-primary-400" />
            同步链路
          </h3>
          <SyncPipeline statuses={syncStatuses} onSyncClick={handleSync} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">今日成功同步</p>
                <p className="text-xl font-mono font-bold text-white">128 次</p>
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
                <p className="text-xl font-mono font-bold text-white">3 次</p>
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
                <p className="text-xl font-mono font-bold text-white">1 个</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <FileText size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">今日同步记录</p>
                <p className="text-xl font-mono font-bold text-white">
                  56,784 条
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

          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-white/5 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 bg-dark-800/30 hover:bg-dark-800/50 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedLog(expandedLog === log.id ? null : log.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    {getStatusBadge(log.status)}
                    <span className="text-sm text-slate-300">
                      {log.sourceName}
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
                          ? `${Math.round(
                              (new Date(log.endTime).getTime() -
                                new Date(log.startTime).getTime()) /
                                1000
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
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 text-xs py-1"
                          >
                            <span className="text-emerald-400">INSERT</span>
                            <span className="text-slate-500 font-mono">
                              record-{log.id}-{i}
                            </span>
                            <span className="text-slate-400">
                              同步成功
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
