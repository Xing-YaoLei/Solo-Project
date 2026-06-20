"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RiskBadge from "@/components/risk-badge";

interface RouteSummary {
  routeId: string;
  routeName: string;
  scenicAreaName: string;
  description?: string;
  totalStops?: number;
  estimatedDuration?: number;
  currentVisitors: number;
  capacityUtilization: number;
  totalRevenue: number;
  alertCount: number;
  riskLevel: string;
  stops: { id: string }[];
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/routes")
      .then((res) => {
        if (!res.ok) throw new Error("请求失败");
        return res.json();
      })
      .then((data) => setRoutes(data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "加载失败")
      )
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="card text-center">
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

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">导览路线</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card">
              <div className="space-y-3">
                <div className="h-5 w-36 animate-pulse rounded bg-[hsl(var(--muted))]" />
                <div className="h-3 w-48 animate-pulse rounded bg-[hsl(var(--muted))]" />
                <div className="h-3 w-full animate-pulse rounded bg-[hsl(var(--muted))]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-[hsl(var(--muted))]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {routes.map((route) => {
            const pct = Math.min(
              Math.round(route.capacityUtilization * 100),
              100
            );
            return (
              <Link
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

                <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                  <span>站点 {route.stops?.length ?? "-"}</span>
                  <span>在园 {route.currentVisitors}</span>
                  <span>营收 ¥{route.totalRevenue.toLocaleString()}</span>
                </div>

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

                {route.alertCount > 0 && (
                  <p className="mt-2 text-xs text-yellow-400">
                    {route.alertCount} 条活跃告警
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
