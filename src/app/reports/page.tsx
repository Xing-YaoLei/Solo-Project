"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Users, DollarSign, Lightbulb } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import LoadingSkeleton from "@/components/loading-skeleton";
import type { AlertSeverity } from "@/lib/types";

type ReviewWithLinkedData = {
  id: string;
  scenicAreaId: string;
  alertId: string | null;
  performanceId: string | null;
  title: string;
  content: string;
  secondaryConsumptionRate: number | null;
  visitorImpact: string | null;
  revenueImpact: string | null;
  recommendations: string | null;
  generatedAt: string;
  alert: { id: string; title: string; severity: AlertSeverity; alertType: string } | null;
  performance: { id: string; title: string; status: string; cancelReason: string | null } | null;
};

const SEVERITY_OPTIONS: { value: AlertSeverity | "ALL"; label: string }[] = [
  { value: "ALL", label: "全部严重度" },
  { value: "LOW", label: "低" },
  { value: "MEDIUM", label: "中" },
  { value: "HIGH", label: "高" },
  { value: "CRITICAL", label: "严重" },
];

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  LOW: "bg-green-500/20 text-green-400 border-green-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
};

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  LOW: "bg-green-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  CRITICAL: "bg-red-400",
};

export default function ReportsPage() {
  const [reviews, setReviews] = useState<ReviewWithLinkedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "ALL">("ALL");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data);
      setError(null);
    } catch {
      setError("获取复盘材料失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = severityFilter === "ALL"
    ? reviews
    : reviews.filter((r) => r.alert?.severity === severityFilter);

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
            onClick={fetchReviews}
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">复盘材料</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">查看与管理演出取消复盘及风险分析报告</p>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | "ALL")}
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => {
          const isExpanded = expandedId === review.id;
          const severity = review.alert?.severity;
          const recommendations = review.recommendations
            ? review.recommendations.split(/\d+\.\s*/).filter(Boolean)
            : [];

          return (
            <div
              key={review.id}
              className={clsx(
                "card cursor-pointer transition-all",
                isExpanded && "ring-1 ring-[hsl(var(--primary))]/30"
              )}
              onClick={() => setExpandedId(isExpanded ? null : review.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {severity && <span className={clsx("inline-block h-3 w-3 rounded-full", SEVERITY_DOT[severity])} title={severity} />}
                    {!severity && <FileText className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{review.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                      <span>{format(new Date(review.generatedAt), "yyyy年M月d日 HH:mm", { locale: zhCN })}</span>
                      {review.alert && (
                        <span className={clsx("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs", SEVERITY_COLORS[review.alert.severity])}>
                          <AlertTriangle className="h-3 w-3" />
                          {review.alert.title}
                        </span>
                      )}
                      {review.performance && (
                        <span className="rounded bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">
                          关联演出：{review.performance.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))]" />
                )}
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-[hsl(var(--border))] pt-4" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-[hsl(var(--foreground))]">复盘内容</h4>
                    <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{review.content}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {review.secondaryConsumptionRate !== null && (
                      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <TrendingUp className="h-4 w-4" />
                          二消转化率
                        </div>
                        <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                          ¥{review.secondaryConsumptionRate.toFixed(2)}
                          <span className="ml-1 text-sm font-normal text-[hsl(var(--muted-foreground))]">/人</span>
                        </p>
                      </div>
                    )}

                    {review.visitorImpact && (
                      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <Users className="h-4 w-4" />
                          游客影响
                        </div>
                        <p className="text-sm text-[hsl(var(--foreground))]">{review.visitorImpact}</p>
                      </div>
                    )}

                    {review.revenueImpact && (
                      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4">
                        <div className="mb-1 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                          <DollarSign className="h-4 w-4" />
                          营收影响
                        </div>
                        <p className="text-sm text-[hsl(var(--foreground))]">{review.revenueImpact}</p>
                      </div>
                    )}
                  </div>

                  {recommendations.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]">
                        <Lightbulb className="h-4 w-4 text-yellow-400" />
                        改进建议
                      </div>
                      <ol className="space-y-2 pl-5">
                        {recommendations.map((rec, i) => (
                          <li key={i} className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))] list-decimal">
                            {rec.trim()}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredReviews.length === 0 && (
        <div className="flex h-40 items-center justify-center text-[hsl(var(--muted-foreground))]">
          暂无复盘材料
        </div>
      )}
    </div>
  );
}
