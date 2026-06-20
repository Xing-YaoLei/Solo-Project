"use client";

import { useEffect, useState, use } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Legend,
} from "recharts";
import RiskBadge from "@/components/risk-badge";

interface StopCongestion {
  stopName: string;
  visitorCount: number;
  capacity: number;
  utilization: number;
  congestionLevel: string;
  avgStayMinutes: number;
}

interface CameraStat {
  id: string;
  recordedAt: string;
  visitorCount: number;
  congestionLevel: string;
  avgStayMinutes: number;
}

interface Performance {
  id: string;
  title: string;
  scheduledTime: string;
  duration: number;
  totalSeats: number;
  soldSeats: number;
  status: string;
  cancelReason: string | null;
}

interface StopDetail {
  id: string;
  name: string;
  type: string;
  stopOrder: number;
  capacity: number;
  cameraStatistics: CameraStat[];
  performances: Performance[];
}

interface OrderItem {
  id: string;
  orderNo: string;
  visitorCount: number;
  totalAmount: number;
  orderTime: string;
  status: string;
  source: string;
}

interface RiskAlertItem {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  isResolved: boolean;
  detectedAt: string;
}

interface RouteDetail {
  id: string;
  name: string;
  description: string;
  totalStops: number;
  estimatedDuration: number;
  currentVisitors: number;
  totalCapacity: number;
  capacityUtilization: number;
  stopCongestionData: StopCongestion[];
  stops: StopDetail[];
  orders: OrderItem[];
  riskAlerts: RiskAlertItem[];
}

const congestionColor = (level: string) => {
  switch (level.toUpperCase()) {
    case "CRITICAL":
      return "#ef4444";
    case "HIGH":
      return "#f97316";
    case "MEDIUM":
      return "#eab308";
    default:
      return "#22c55e";
  }
};

const stopTypeLabel: Record<string, string> = {
  POINT_OF_INTEREST: "景点",
  REST_AREA: "休息区",
  PERFORMANCE_VENUE: "演出场地",
  MERCHANT: "商户",
};

const orderStatusLabel: Record<string, string> = {
  PENDING: "待确认",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  COMPLETED: "已完成",
};

const sourceLabel: Record<string, string> = {
  WECHAT: "微信",
  ALIPAY: "支付宝",
  OFFLINE: "线下",
};

interface TooltipEntry {
  color?: string
  name?: string
  value?: number | string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}

interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: { congestionLevel: string }
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-sm shadow-lg">
      <p className="mb-1 font-medium text-[hsl(var(--foreground))]">{label}</p>
      {payload.map((entry: TooltipEntry, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stops" | "orders" | "alerts">(
    "stops"
  );

  useEffect(() => {
    fetch(`/api/routes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("请求失败");
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "加载失败")
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function handleResolve(alertId: string) {
    try {
      const res = await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId }),
      });
      if (res.ok && data) {
        setData({
          ...data,
          riskAlerts: data.riskAlerts.filter((a) => a.id !== alertId),
        });
      }
    } catch {}
  }

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

  if (loading || !data) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-[hsl(var(--muted))]" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-72 animate-pulse rounded bg-[hsl(var(--muted))]" />
          ))}
        </div>
        <div className="card h-64 animate-pulse rounded bg-[hsl(var(--muted))]" />
      </div>
    );
  }

  const timelineMap = new Map<string, { visitorCount: number; staySum: number; count: number }>();
  data.stops.forEach((stop) => {
    stop.cameraStatistics.forEach((stat) => {
      const timeKey = new Date(stat.recordedAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const existing = timelineMap.get(timeKey);
      if (existing) {
        existing.visitorCount += stat.visitorCount;
        existing.staySum += stat.avgStayMinutes;
        existing.count += 1;
      } else {
        timelineMap.set(timeKey, {
          visitorCount: stat.visitorCount,
          staySum: stat.avgStayMinutes,
          count: 1,
        });
      }
    });
  });

  const timelineData = Array.from(timelineMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, val]) => ({
      time,
      visitorCount: val.visitorCount,
      avgStay: Math.round(val.staySum / val.count),
    }));

  const performanceData = data.stops
    .flatMap((s) => s.performances)
    .filter((p) => p.status === "SCHEDULED")
    .map((p) => ({
      title: p.title,
      total: p.totalSeats,
      sold: p.soldSeats,
      available: p.totalSeats - p.soldSeats,
    }));

  const tabs = [
    { key: "stops" as const, label: "站点明细" },
    { key: "orders" as const, label: "订单明细" },
    { key: "alerts" as const, label: "风险告警" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {data.description}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span>
            站点 <strong className="text-[hsl(var(--foreground))]">{data.totalStops}</strong>
          </span>
          <span>
            在园 <strong className="text-[hsl(var(--foreground))]">{data.currentVisitors}</strong>
          </span>
          <span>
            利用率 <strong className="text-[hsl(var(--foreground))]">{Math.round(data.capacityUtilization * 100)}%</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card">
          <h2 className="mb-4 text-base font-semibold">热力点位图</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.stopCongestionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="stopName"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="visitorCount"
                name="实时客流"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                shape={(props: BarShapeProps) => {
                  const { x, y, width, height, payload } = props;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={congestionColor(payload?.congestionLevel ?? "LOW")}
                      rx={4}
                      ry={4}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="mb-4 text-base font-semibold">导览内容统计</h2>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                label={{
                  value: "客流",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                label={{
                  value: "停留(分)",
                  angle: 90,
                  position: "insideRight",
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="visitorCount"
                name="客流量"
                yAxisId="left"
                fill="#3b82f6"
                fillOpacity={0.2}
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="avgStay"
                name="平均停留"
                yAxisId="right"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="mb-4 text-base font-semibold">演出座位分布</h2>
          {performanceData.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-[hsl(var(--muted-foreground))]">
              暂无排期演出
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={performanceData}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
                />
                <Bar
                  dataKey="sold"
                  name="已售"
                  stackId="seats"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="available"
                  name="可用"
                  stackId="seats"
                  fill="#475569"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card bg-[hsl(var(--muted))]/30">
        <div className="mb-4 flex gap-1 border-b border-[hsl(var(--border))] pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "stops" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                  <th className="px-4 py-3">站点名称</th>
                  <th className="px-4 py-3">类型</th>
                  <th className="px-4 py-3">实时客流</th>
                  <th className="px-4 py-3">容量</th>
                  <th className="px-4 py-3">利用率</th>
                  <th className="px-4 py-3">拥堵等级</th>
                  <th className="px-4 py-3">平均停留</th>
                </tr>
              </thead>
              <tbody>
                {data.stopCongestionData.map((stop, i) => (
                  <tr
                    key={i}
                    className="border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{stop.stopName}</td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {stopTypeLabel[data.stops[i]?.type] ?? "-"}
                    </td>
                    <td className="px-4 py-3">{stop.visitorCount}</td>
                    <td className="px-4 py-3">{stop.capacity}</td>
                    <td className="px-4 py-3">
                      {Math.round(stop.utilization * 100)}%
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={stop.congestionLevel} />
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {stop.avgStayMinutes}分钟
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                  <th className="px-4 py-3">订单号</th>
                  <th className="px-4 py-3">人数</th>
                  <th className="px-4 py-3">金额</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">来源</th>
                  <th className="px-4 py-3">下单时间</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {order.orderNo}
                    </td>
                    <td className="px-4 py-3">{order.visitorCount}</td>
                    <td className="px-4 py-3">
                      ¥{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {orderStatusLabel[order.status] ?? order.status}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {sourceLabel[order.source] ?? order.source}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      {new Date(order.orderTime).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "alerts" && (
          <>
            {data.riskAlerts.length === 0 ? (
              <p className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                暂无活跃告警
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-foreground))]">
                      <th className="px-4 py-3">严重程度</th>
                      <th className="px-4 py-3">标题</th>
                      <th className="px-4 py-3">描述</th>
                      <th className="px-4 py-3">检测时间</th>
                      <th className="px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.riskAlerts.map((alert) => (
                      <tr
                        key={alert.id}
                        className="border-b border-[hsl(var(--border))] last:border-0"
                      >
                        <td className="px-4 py-3">
                          <RiskBadge level={alert.severity} />
                        </td>
                        <td className="px-4 py-3">{alert.title}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-[hsl(var(--muted-foreground))]">
                          {alert.description}
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
          </>
        )}
      </div>
    </div>
  );
}
