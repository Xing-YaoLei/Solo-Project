"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { KPICard } from "@/components/KPICard";
import { DataTable } from "@/components/DataTable";
import {
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  User,
  Truck,
  Navigation,
} from "lucide-react";
import {
  cn,
  formatDateTime,
  formatNumber,
  formatTime,
  getStatusColorClass,
  getStatusLabel,
} from "@/lib/utils";
import type { DriverCheckinType, TrackPointType } from "@/types";

export default function DriverTrackingPage() {
  const [checkins, setCheckins] = useState<DriverCheckinType[]>([]);
  const [checkinStats, setCheckinStats] = useState({
    totalDrivers: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    abnormal: 0,
  });
  const [selectedDriver, setSelectedDriver] = useState<DriverCheckinType | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPointType[]>([]);
  const [trackStats, setTrackStats] = useState({
    totalPoints: 0,
    avgSpeed: 0,
    orderStops: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/drivers/checkin");
        const json = await res.json();
        setCheckins(json.data.list);
        setCheckinStats(json.data.stats);
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!isPlaying || trackPoints.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= trackPoints.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isPlaying, trackPoints.length]);

  const handleDriverSelect = async (driver: DriverCheckinType) => {
    setSelectedDriver(driver);
    setCurrentIndex(0);
    setIsPlaying(false);
    try {
      const res = await fetch(`/api/drivers/${driver.driverId}/track`);
      const json = await res.json();
      setTrackPoints(json.data.trackPoints);
      setTrackStats(json.data.stats);
    } catch (error) {
      console.error("加载轨迹数据失败:", error);
    }
  };

  const checkinColumns = [
    {
      key: "driver",
      title: "司机信息",
      render: (row: DriverCheckinType) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.driverName}</p>
            <p className="text-xs text-muted font-mono">{row.vehicleNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: "routeName",
      title: "所属路线",
      render: (row: DriverCheckinType) => (
        <span className="badge-info inline-flex items-center gap-1">
          <Truck size={12} />
          {row.routeName}
        </span>
      ),
    },
    {
      key: "checkinTime",
      title: "签到时间",
      render: (row: DriverCheckinType) =>
        row.checkinTime ? formatDateTime(row.checkinTime) : "-",
    },
    {
      key: "status",
      title: "签到状态",
      render: (row: DriverCheckinType) => {
        const Icon =
          row.status === "checked_in"
            ? CheckCircle
            : row.status === "abnormal"
            ? AlertTriangle
            : Clock;
        return (
          <span className={getStatusColorClass(row.status)}>
            <Icon size={12} className="inline mr-1" />
            {getStatusLabel(row.status)}
          </span>
        );
      },
    },
    {
      key: "action",
      title: "轨迹",
      render: (row: DriverCheckinType) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDriverSelect(row);
          }}
          className={cn(
            "btn-primary !px-2.5 !py-1 text-xs inline-flex items-center gap-1",
            selectedDriver?.id === row.id && "!bg-primary/40"
          )}
        >
          <Navigation size={12} />
          {selectedDriver?.id === row.id ? "查看中" : "轨迹回放"}
        </button>
      ),
    },
  ];

  const currentPoint = trackPoints[currentIndex];

  return (
    <div>
      <Header title="司机签到与轨迹回放" subtitle="实时签到监控与历史轨迹联动分析" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="在岗司机"
            value={checkinStats.totalDrivers}
            accentColor="primary"
            icon={<User size={20} />}
          />
          <KPICard
            title="已签到"
            value={checkinStats.checkedIn}
            accentColor="success"
            icon={<CheckCircle size={20} />}
          />
          <KPICard
            title="未签到"
            value={checkinStats.notCheckedIn}
            accentColor="warning"
            icon={<Clock size={20} />}
          />
          <KPICard
            title="签到异常"
            value={checkinStats.abnormal}
            accentColor="danger"
            icon={<AlertTriangle size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="glass-card p-5 gradient-border">
              <div className="mb-4">
                <h3 className="text-base font-display font-semibold flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  司机签到列表
                </h3>
                <p className="text-xs text-muted mt-0.5">点击查看轨迹回放</p>
              </div>
              <div className="-mx-5 -mb-5">
                <DataTable
                  columns={checkinColumns}
                  data={checkins}
                  rowKey="id"
                  onRowClick={handleDriverSelect}
                  maxHeight="520px"
                  className="!rounded-none border-x-0 border-b-0"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="glass-card p-5 gradient-border h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-display font-semibold flex items-center gap-2">
                    <MapPin size={18} className="text-primary" />
                    轨迹回放面板
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {selectedDriver
                      ? `${selectedDriver.driverName} · ${selectedDriver.routeName}`
                      : "请选择司机查看轨迹"}
                  </p>
                </div>
                {selectedDriver && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">平均速度</span>
                    <span className="text-sm font-mono font-medium text-primary">
                      {formatNumber(trackStats.avgSpeed, 1)} km/h
                    </span>
                    <span className="text-xs text-muted ml-3">停靠点</span>
                    <span className="text-sm font-mono font-medium text-success">
                      {trackStats.orderStops}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative h-80 rounded-lg bg-surface-200 border border-border overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" viewBox="0 0 400 320">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E3A5F" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {!selectedDriver ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                    <Navigation size={48} className="opacity-30 mb-3" />
                    <p>选择左侧司机开始轨迹回放</p>
                  </div>
                ) : trackPoints.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-muted">
                    暂无轨迹数据
                  </div>
                ) : (
                  <>
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 400 320"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#00C48C" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      <polyline
                        fill="none"
                        stroke="#1E3A5F"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={trackPoints
                          .map((p, i) => {
                            const x = 40 + ((p.lng - 121.3) / 0.3) * 320;
                            const y = 40 + ((31.3 - p.lat) / 0.2) * 240;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                      <polyline
                        fill="none"
                        stroke="url(#trackGradient)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={trackPoints
                          .slice(0, currentIndex + 1)
                          .map((p) => {
                            const x = 40 + ((p.lng - 121.3) / 0.3) * 320;
                            const y = 40 + ((31.3 - p.lat) / 0.2) * 240;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                        style={{
                          filter: "drop-shadow(0 0 6px rgba(0,212,255,0.5))",
                        }}
                      />
                      {trackPoints.map((p, i) => {
                        const x = 40 + ((p.lng - 121.3) / 0.3) * 320;
                        const y = 40 + ((31.3 - p.lat) / 0.2) * 240;
                        const isOrderStop = !!p.orderId;
                        const isCurrent = i === currentIndex;
                        return (
                          <g key={i}>
                            {isOrderStop && (
                              <circle cx={x} cy={y} r="8" fill="#FFB020" opacity="0.2" />
                            )}
                            <circle
                              cx={x}
                              cy={y}
                              r={isCurrent ? 7 : isOrderStop ? 5 : 3}
                              fill={isCurrent ? "#00D4FF" : isOrderStop ? "#FFB020" : "#475569"}
                              stroke={isCurrent ? "#0A1628" : "none"}
                              strokeWidth={isCurrent ? 2 : 0}
                              style={
                                isCurrent
                                  ? { filter: "drop-shadow(0 0 10px #00D4FF)" }
                                  : undefined
                              }
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {currentPoint && (
                      <div className="absolute bottom-3 left-3 right-3 glass-card p-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted">时间</span>
                            <span className="ml-2 font-mono text-foreground">
                              {formatTime(currentPoint.timestamp)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted">速度</span>
                            <span className="ml-2 font-mono text-primary">
                              {formatNumber(currentPoint.speed, 1)} km/h
                            </span>
                          </div>
                          <div>
                            <span className="text-muted">坐标</span>
                            <span className="ml-2 font-mono text-foreground">
                              {currentPoint.lat.toFixed(4)}, {currentPoint.lng.toFixed(4)}
                            </span>
                          </div>
                          {currentPoint.orderId && (
                            <span className="badge-warning">工单停靠</span>
                          )}
                        </div>
                        <span className="text-xs text-muted font-mono">
                          {currentIndex + 1} / {trackPoints.length}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedDriver && trackPoints.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setCurrentIndex(0);
                      setIsPlaying(false);
                    }}
                    className="p-2 rounded-lg bg-surface-200 border border-border hover:bg-surface-300 hover:border-primary/30 transition-all"
                  >
                    <SkipBack size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="p-2 rounded-lg bg-surface-200 border border-border hover:bg-surface-300 hover:border-primary/30 transition-all"
                  >
                    <SkipBack size={18} style={{ transform: "scaleX(-1)" }} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 hover:shadow-glow transition-all"
                  >
                    {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                  </button>
                  <button
                    onClick={() => {
                      setCurrentIndex((prev) =>
                        Math.min(trackPoints.length - 1, prev + 1)
                      );
                    }}
                    className="p-2 rounded-lg bg-surface-200 border border-border hover:bg-surface-300 hover:border-primary/30 transition-all"
                  >
                    <SkipForward size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentIndex(trackPoints.length - 1);
                      setIsPlaying(false);
                    }}
                    className="p-2 rounded-lg bg-surface-200 border border-border hover:bg-surface-300 hover:border-primary/30 transition-all"
                  >
                    <SkipForward size={18} style={{ transform: "scaleX(-1)" }} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
