"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { OnTimeReviewChart } from "@/components/charts/OnTimeReviewChart";
import {
  Route,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ClipboardList,
  Truck,
  ExternalLink,
} from "lucide-react";
import {
  cn,
  formatDateTime,
  formatDuration,
  formatTime,
  getStatusColorClass,
  getStatusLabel,
} from "@/lib/utils";
import type { RoutePlanType, RouteSampleDetail } from "@/types";

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<RoutePlanType[]>([]);
  const [stats, setStats] = useState({
    totalRoutes: 0,
    completedRoutes: 0,
    delayedRoutes: 0,
    avgDelayMinutes: 0,
  });
  const [selectedRoute, setSelectedRoute] = useState<RoutePlanType | null>(null);
  const [routeSamples, setRouteSamples] = useState<RouteSampleDetail[]>([]);
  const [sampleStats, setSampleStats] = useState({
    totalSamples: 0,
    onTimeCount: 0,
    delayedCount: 0,
    avgDelayMinutes: 0,
  });
  const [routeMeta, setRouteMeta] = useState<{
    driverId: string;
    driverName: string;
    routeName: string;
    vehicleNo: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const onTimeReviewData = [
    { period: "第1周", rate: 82.5, target: 90 },
    { period: "第2周", rate: 85.2, target: 90 },
    { period: "第3周", rate: 88.1, target: 90 },
    { period: "第4周", rate: 91.3, target: 90 },
    { period: "本周", rate: 93.7, target: 90 },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/routes/list");
        const json = await res.json();
        setRoutes(json.data.list);
        setStats(json.data.stats);
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRouteClick = async (route: RoutePlanType) => {
    setSelectedRoute(route);
    try {
      const res = await fetch(`/api/routes/${route.id}/details`);
      const json = await res.json();
      setRouteSamples(json.data.samples);
      setSampleStats(json.data.stats);
      setRouteMeta(json.data.meta ?? null);
    } catch (error) {
      console.error("加载路线详情失败:", error);
    }
  };

  const openDriverTrack = () => {
    if (!selectedRoute) return;
    const driverId = routeMeta?.driverId ?? selectedRoute.driverName;
    const params = new URLSearchParams({
      driverId,
      routeId: selectedRoute.id,
      driverName: routeMeta?.driverName ?? selectedRoute.driverName,
      routeName: selectedRoute.routeName,
    });
    router.push(`/driver-tracking?${params.toString()}`);
    setSelectedRoute(null);
  };

  const openLoadingList = () => {
    if (!selectedRoute) return;
    const params = new URLSearchParams({
      routeId: selectedRoute.id,
      routeName: selectedRoute.routeName,
    });
    router.push(`/loading-list?${params.toString()}`);
    setSelectedRoute(null);
  };

  const renderTimeBar = (route: RoutePlanType) => {
    const plannedStart = new Date(route.plannedStartTime).getTime();
    const plannedEnd = new Date(route.plannedEndTime).getTime();
    const actualStart = route.actualStartTime
      ? new Date(route.actualStartTime).getTime()
      : null;
    const actualEnd = route.actualEndTime
      ? new Date(route.actualEndTime).getTime()
      : null;

    const totalDuration = plannedEnd - plannedStart;
    const barDuration = 180;

    const plannedWidth = barDuration;
    const actualWidth = actualStart && actualEnd
      ? ((actualEnd - actualStart) / totalDuration) * barDuration
      : 0;
    const actualOffset = actualStart
      ? ((actualStart - plannedStart) / totalDuration) * barDuration
      : 0;

    return (
      <div className="flex items-center gap-3 min-w-[220px]">
        <span className="text-xs text-muted font-mono w-10">
          {formatTime(route.plannedStartTime)}
        </span>
        <div className="relative flex-1 h-6">
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-surface-300 border border-border"
            style={{ width: plannedWidth }}
          />
          {actualStart && actualEnd && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-3 rounded-full",
                route.status === "delayed"
                  ? "bg-gradient-to-r from-danger/80 to-danger shadow-[0_0_10px_rgba(255,92,122,0.4)]"
                  : "bg-gradient-to-r from-primary/80 to-success shadow-[0_0_10px_rgba(0,196,140,0.4)]"
              )}
              style={{
                width: Math.min(actualWidth, barDuration + 40),
                left: Math.max(0, actualOffset),
              }}
            />
          )}
        </div>
        <span className="text-xs text-muted font-mono w-10 text-right">
          {formatTime(route.plannedEndTime)}
        </span>
      </div>
    );
  };

  const routeColumns = [
    {
      key: "routeName",
      title: "路线名称",
      render: (row: RoutePlanType) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Truck size={14} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.routeName}</p>
            <p className="text-xs text-muted">{row.driverName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "timeline",
      title: "执行时间轴",
      render: (row: RoutePlanType) => renderTimeBar(row),
      width: "280px",
    },
    {
      key: "plannedOrderCount",
      title: "工单进度",
      render: (row: RoutePlanType) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-surface-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-success rounded-full"
              style={{
                width: `${(row.completedOrderCount / row.plannedOrderCount) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-mono">
            {row.completedOrderCount}/{row.plannedOrderCount}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "状态",
      render: (row: RoutePlanType) => (
        <span className={getStatusColorClass(row.status)}>
          {getStatusLabel(row.status)}
        </span>
      ),
    },
    {
      key: "delayMinutes",
      title: "延误时长",
      render: (row: RoutePlanType) =>
        row.delayMinutes ? (
          <span className="text-danger font-mono font-medium">
            {formatDuration(row.delayMinutes)}
          </span>
        ) : (
          <span className="text-muted">-</span>
        ),
      highlight: (row: RoutePlanType) => (row.delayMinutes ?? 0) > 30,
    },
    {
      key: "action",
      title: "样本明细",
      render: (row: RoutePlanType) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRouteClick(row);
          }}
          className="btn-primary !px-2.5 !py-1 text-xs inline-flex items-center gap-1"
        >
          <ClipboardList size={12} />
          下钻
          <ChevronRight size={12} />
        </button>
      ),
    },
  ];

  const sampleColumns = [
    {
      key: "orderNo",
      title: "工单号",
      render: (row: RouteSampleDetail) => (
        <span className="font-mono text-primary">{row.orderNo}</span>
      ),
    },
    {
      key: "apartmentId",
      title: "公寓",
    },
    {
      key: "repairType",
      title: "维修类型",
    },
    {
      key: "plannedTime",
      title: "计划时间",
      render: (row: RouteSampleDetail) => formatDateTime(row.plannedTime),
    },
    {
      key: "actualTime",
      title: "实际时间",
      render: (row: RouteSampleDetail) =>
        row.actualTime ? formatDateTime(row.actualTime) : "-",
    },
    {
      key: "isOnTime",
      title: "是否准时",
      render: (row: RouteSampleDetail) =>
        row.isOnTime ? (
          <span className="badge-success inline-flex items-center gap-1">
            <CheckCircle2 size={12} />
            准时
          </span>
        ) : (
          <span className="badge-danger inline-flex items-center gap-1">
            <AlertCircle size={12} />
            延误
          </span>
        ),
    },
    {
      key: "delayMinutes",
      title: "延误时长",
      render: (row: RouteSampleDetail) =>
        row.delayMinutes ? (
          <span className="text-danger font-mono">
            {formatDuration(row.delayMinutes)}
          </span>
        ) : (
          "-"
        ),
      highlight: (row: RouteSampleDetail) => (row.delayMinutes ?? 0) > 30,
    },
  ];

  return (
    <div>
      <Header title="路线计划与执行总览" subtitle="路线执行监控与延误缺口分析" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="路线总数"
            value={stats.totalRoutes}
            accentColor="primary"
            icon={<Route size={20} />}
          />
          <KPICard
            title="已完成路线"
            value={stats.completedRoutes}
            accentColor="success"
            icon={<CheckCircle2 size={20} />}
          />
          <KPICard
            title="延误路线"
            value={stats.delayedRoutes}
            accentColor="danger"
            icon={<AlertCircle size={20} />}
          />
          <KPICard
            title="平均延误时长"
            value={stats.avgDelayMinutes}
            unit="分钟"
            accentColor="warning"
            icon={<Clock size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-5 gradient-border">
              <div className="mb-4">
                <h3 className="text-base font-display font-semibold flex items-center gap-2">
                  <Route size={18} className="text-primary" />
                  路线执行列表
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  点击「下钻」查看延误样本明细
                </p>
              </div>
              <div className="-mx-5 -mb-5">
                <DataTable
                  columns={routeColumns}
                  data={routes}
                  rowKey="id"
                  onRowClick={handleRouteClick}
                  maxHeight="480px"
                  className="!rounded-none border-x-0 border-b-0"
                />
              </div>
            </div>
          </div>
          <div>
            <OnTimeReviewChart data={onTimeReviewData} />
          </div>
        </div>
      </div>

      <Modal
        open={!!selectedRoute}
        onClose={() => setSelectedRoute(null)}
        title="路线样本明细"
        subtitle={`${selectedRoute?.routeName} · ${selectedRoute?.driverName}`}
        size="xl"
      >
        {selectedRoute && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass-card p-3">
                <p className="text-xs text-muted">总工单数</p>
                <p className="text-xl font-display font-bold mt-1">
                  {sampleStats.totalSamples}
                </p>
              </div>
              <div className="glass-card p-3">
                <p className="text-xs text-muted">准时完成</p>
                <p className="text-xl font-display font-bold text-success mt-1">
                  {sampleStats.onTimeCount}
                </p>
              </div>
              <div className="glass-card p-3">
                <p className="text-xs text-muted">延误单数</p>
                <p className="text-xl font-display font-bold text-danger mt-1">
                  {sampleStats.delayedCount}
                </p>
              </div>
              <div className="glass-card p-3">
                <p className="text-xs text-muted">平均延误</p>
                <p className="text-xl font-display font-bold text-warning mt-1">
                  {sampleStats.avgDelayMinutes}分钟
                </p>
              </div>
            </div>

            <DataTable
              columns={sampleColumns}
              data={routeSamples}
              rowKey="orderId"
              maxHeight="360px"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={openDriverTrack}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <MapPin size={16} />
                关联司机轨迹
                <ExternalLink size={14} />
              </button>
              <button
                onClick={openLoadingList}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ClipboardList size={16} />
                查看装载清单
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
