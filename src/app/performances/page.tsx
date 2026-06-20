"use client";

import { useEffect, useState, useCallback } from "react";
import { Theater, FileText, Clock, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { PerformanceStatus } from "@/lib/types";

type PerformanceWithStop = {
  id: string;
  scenicAreaId: string;
  stopId: string;
  title: string;
  scheduledTime: string;
  duration: number;
  totalSeats: number;
  soldSeats: number;
  status: PerformanceStatus;
  cancelReason: string | null;
  stop: { id: string; name: string; type: string; routeId: string; route?: { id: string; name: string; riskAlerts: { id: string; title: string; severity: string }[] } };
  reviewMaterials?: { id: string; title: string; generatedAt: string }[];
};

type FilterTab = "ALL" | "COMPLETED" | "CANCELLED" | "SCHEDULED";

const TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "全部" },
  { key: "COMPLETED", label: "已完成" },
  { key: "CANCELLED", label: "已取消" },
  { key: "SCHEDULED", label: "待演出" },
];

const STATUS_BADGES: Record<PerformanceStatus, { label: string; className: string }> = {
  SCHEDULED: { label: "待演出", className: "badge-low" },
  COMPLETED: { label: "已完成", className: "bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs" },
  CANCELLED: { label: "已取消", className: "badge-critical" },
};

export default function PerformancesPage() {
  const [performances, setPerformances] = useState<PerformanceWithStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchPerformances = useCallback(async (status?: FilterTab) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.set("status", status);
      const res = await fetch(`/api/performances?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerformances(data);
      setError(null);
    } catch {
      setError("获取演出数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformances(activeTab);
  }, [activeTab, fetchPerformances]);

  const handleGenerateReview = async (performanceId: string) => {
    setGeneratingId(performanceId);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performanceId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成失败");
      }
      fetchPerformances(activeTab);
    } catch (e) {
      alert(e instanceof Error ? e.message : "生成复盘材料失败");
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="card text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => fetchPerformances(activeTab)}
            className="rounded bg-[hsl(var(--primary))] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">演出监测</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">实时监控演出状态和上座情况</p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-[hsl(var(--primary))] text-white"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {performances.map((perf) => {
          const fillRate = perf.totalSeats > 0 ? (perf.soldSeats / perf.totalSeats) * 100 : 0;
          const badge = STATUS_BADGES[perf.status];

          return (
            <div key={perf.id} className="card flex flex-col">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Theater className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <h3 className="font-semibold text-[hsl(var(--foreground))]">{perf.title}</h3>
                </div>
                <span className={badge.className}>{badge.label}</span>
              </div>

              <div className="mb-2 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(perf.scheduledTime), "yyyy年M月d日 HH:mm", { locale: zhCN })}</span>
              </div>

              <div className="mb-3 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                <MapPin className="h-4 w-4" />
                <span>{perf.stop?.name || "未知场地"}</span>
              </div>

              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">上座率</span>
                <span className={clsx("font-semibold", fillRate >= 80 ? "text-green-400" : fillRate >= 50 ? "text-yellow-400" : "text-red-400")}>
                  {fillRate.toFixed(1)}%
                </span>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all",
                    fillRate >= 80 ? "bg-green-500" : fillRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(fillRate, 100)}%` }}
                />
              </div>
              <div className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">
                {perf.soldSeats} / {perf.totalSeats} 座
              </div>

              {perf.status === "CANCELLED" && (
                <div className="mt-auto space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  {perf.cancelReason && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <span className="text-red-300">取消原因：{perf.cancelReason}</span>
                    </div>
                  )}

                  {perf.reviewMaterials && perf.reviewMaterials.length > 0 && (
                    <div className="space-y-1">
                      {perf.reviewMaterials.map((rm) => (
                        <a
                          key={rm.id}
                          href={`/reports?highlight=${rm.id}`}
                          className="flex items-center gap-2 rounded px-2 py-1 text-sm text-blue-400 hover:bg-blue-400/10 transition-colors"
                        >
                          <FileText className="h-4 w-4" />
                          {rm.title}
                        </a>
                      ))}
                    </div>
                  )}

                  {(!perf.reviewMaterials || perf.reviewMaterials.length === 0) && (
                    <button
                      onClick={() => handleGenerateReview(perf.id)}
                      disabled={generatingId === perf.id}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {generatingId === perf.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      生成复盘材料
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {performances.length === 0 && (
        <div className="flex h-40 items-center justify-center text-[hsl(var(--muted-foreground))]">
          暂无演出数据
        </div>
      )}
    </div>
  );
}
