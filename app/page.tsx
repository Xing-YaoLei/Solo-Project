"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { TrendChart } from "@/components/charts/TrendChart";
import { AnomalyPieChart } from "@/components/charts/AnomalyPieChart";
import { ClipboardList, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { KPIData, DispatchTrendPoint, AnomalyDistribution } from "@/types";

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<DispatchTrendPoint[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [kpiRes, trendRes] = await Promise.all([
          fetch("/api/dispatch/kpi"),
          fetch("/api/dispatch/trend?days=30"),
        ]);
        const kpiJson = await kpiRes.json();
        const trendJson = await trendRes.json();
        setKpi(kpiJson.data);
        setTrendData(trendJson.data.trend);
        setAnomalyData(trendJson.data.anomalies);
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      <Header
        title="维修派单趋势看板"
        subtitle="实时监控派单趋势与运营指标"
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 glass-card animate-pulse"
              />
            ))
          ) : (
            <>
              <KPICard
                title="今日派单量"
                value={kpi?.todayOrders ?? 0}
                yoy={kpi?.todayOrdersYoY}
                mom={kpi?.todayOrdersMoM}
                accentColor="primary"
                icon={<ClipboardList size={20} />}
              />
              <KPICard
                title="准时率"
                value={kpi?.onTimeRate ?? 0}
                format="percent"
                yoy={kpi?.onTimeRateYoY}
                mom={kpi?.onTimeRateMoM}
                accentColor="success"
                icon={<CheckCircle size={20} />}
              />
              <KPICard
                title="延误单量"
                value={kpi?.delayedCount ?? 0}
                accentColor="warning"
                icon={<Clock size={20} />}
              />
              <KPICard
                title="异常单量"
                value={kpi?.anomalyCount ?? 0}
                accentColor="danger"
                icon={<XCircle size={20} />}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="h-96 glass-card animate-pulse" />
            ) : (
              trendData.length > 0 && <TrendChart data={trendData} />
            )}
          </div>
          <div>
            {loading ? (
              <div className="h-96 glass-card animate-pulse" />
            ) : (
              anomalyData.length > 0 && <AnomalyPieChart data={anomalyData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
