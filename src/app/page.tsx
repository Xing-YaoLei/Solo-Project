"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, AlertTriangle, XCircle } from "lucide-react";
import RiskBadge from "@/components/risk-badge";

interface DashboardData {
  totalVisitors: number;
  totalRevenue: number;
  activeAlertsCount: number;
  alertsBySeverity: Record<string, number>;
  routeRiskSummaries: RouteRiskSummary[];
  cancelledPerformanceCount: number;
}

interface RouteRiskSummary {
  routeId: string;
  routeName: string;
  scenicAreaName: string;
  currentVisitors: number;
  capacityUtilization: number;
  alertCount: number;
  criticalAlertCount: number;
  riskLevel: string;
}

interface AlertItem {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  detectedAt: string;
  isResolved: boolean;
  route: { id: string; name: string } | null;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, alertRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/alerts?isResolved=false"),
        ]);
        if (!dashRes.ok || !alertRes.ok) throw new Error("请求失败");
        const dashData = await dashRes.json();
        const alertData = await alertRes.json();
        setDashboard(dashData);
        setAlerts(alertData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleResolve(alertId: string) {
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch {}
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="card text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <p className="text-lg text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const statCards = dashboard
    ? [
        {
          label: "今日客流",
          value: dashboard.totalVisitors.toLocaleString(),
          icon: Users,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
        },
        {
          label: "今日营收",
          value: `¥${dashboard.totalRevenue.toLocaleString()}`,
          icon: DollarSign,
          color: "text-green-400",
          bg: "bg-green-500/10",
        },
        {
          label: "活跃告警",
          value: dashboard.activeAlertsCount.toString(),
          icon: AlertTriangle,
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
        },
        {
          label: "取消演出",
          value: dashboard.cancelledPerformanceCount.toString(),
          icon: XCircle,
          color: "text-red-400",
          bg: "bg-red-500/10",
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">运营仪表盘</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card">
                <div className="space-y-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-[hsl(var(--muted))]" />
                  <div className="h-8 w-28 animate-pulse rounded bg-[hsl(var(--muted))]" />
                </div>
              </div>
            ))
          : statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      {card.label}
                    </span>
                    <div className={`rounded-lg p-2 ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold">{card.value}</p>
                </div>
              );
            })}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">路线风险概览</h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card">
                <div className="space-y-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-[hsl(var(--muted))]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[hsl(var(--muted))]" />
                  <div className="h-3 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboard!.routeRiskSummaries.map((route) => {
              const pct = Math.min(
                Math.round(route.capacityUtilization * 100),
                100
              );
              return (
                <a
                  key={route.routeId}
                  href={`/routes/${route.routeId}`}
                  className="card transition hover:border-[hsl(var(--primary))]"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{route.routeName}</h3>
                    <RiskBadge level={route.riskLevel} />
                  </div>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {route.scenicAreaName}
                  </p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                      <span>容量利用率</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            pct >= 90
                              ? "rgb(239 68 68)"
                              : pct >= 70
                              ? "rgb(249 115 22)"
                              : pct >= 50
                              ? "rgb(234 179 8)"
                              : "rgb(34 197 94)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      告警{" "}
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {route.alertCount}
                      </span>
                    </span>
                    <span className="text-[hsl(var(--muted-foreground))]">
                      在园{" "}
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {route.currentVisitors}
                      </span>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">活跃告警</h2>
        {loading ? (
          <div className="card space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-[hsl(var(--muted))]"
              />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="card text-center text-[hsl(var(--muted-foreground))]">
            暂无活跃告警
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                  <th className="px-4 py-3">严重程度</th>
                  <th className="px-4 py-3">告警标题</th>
                  <th className="px-4 py-3">关联路线</th>
                  <th className="px-4 py-3">检测时间</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <td className="px-4 py-3">
                      <RiskBadge level={alert.severity} />
                    </td>
                    <td className="px-4 py-3">{alert.title}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {alert.route?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {new Date(alert.detectedAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="rounded bg-[hsl(var(--primary))] px-3 py-1 text-xs text-white hover:opacity-90"
                      >
                        解除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
