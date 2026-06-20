"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
  Area,
  ComposedChart,
} from "recharts";
import { AlertTriangle } from "lucide-react";

interface RouteData {
  date: string;
  hasCancel?: boolean;
  performanceId?: string;
  performanceName?: string;
  cancelReason?: string;
  [key: string]: string | number | boolean | undefined;
}

interface CancelEvent {
  id: string;
  date: string;
  performanceName: string;
  performanceId: string;
  reason: string;
  affectedCount: number;
}

interface TrendChartProps {
  routes: {
    id: string;
    name: string;
    color: string;
    data: { date: string; visitorCount: number }[];
  }[];
  cancelEvents: CancelEvent[];
  onCancelClick?: (performanceId: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-400 mb-2 font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-300">{entry.name}</span>
            <span className="text-sm font-mono font-semibold text-white ml-auto">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CancelDot = ({ cx, cy, payload, onClick }: any) => {
  if (!payload?.hasCancel) return null;

  return (
    <g onClick={() => onClick?.(payload.performanceId)} className="cursor-pointer">
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill="#f97316"
        fillOpacity={0.2}
        className="animate-pulse"
      />
      <circle cx={cx} cy={cy} r={6} fill="#f97316" />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fill="white"
        fontSize={10}
        fontWeight="bold"
      >
        !
      </text>
    </g>
  );
};

export default function TrendChart({
  routes,
  cancelEvents,
  onCancelClick,
}: TrendChartProps) {
  const chartData = useMemo(() => {
    if (routes.length === 0) return [];

    const allDates = new Set<string>();
    routes.forEach((route) => {
      route.data.forEach((d) => allDates.add(d.date));
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => {
      const row: RouteData = { date };
      routes.forEach((route) => {
        const point = route.data.find((d) => d.date === date);
        row[route.name] = point?.visitorCount || 0;
      });

      const cancelEvent = cancelEvents.find((e) => e.date === date);
      if (cancelEvent) {
        row.hasCancel = true;
        row.performanceId = cancelEvent.performanceId;
        row.performanceName = cancelEvent.performanceName;
        row.cancelReason = cancelEvent.reason;
      }

      return row;
    });
  }, [routes, cancelEvents]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            {routes.map((route) => (
              <linearGradient
                key={route.id}
                id={`color-${route.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={route.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={route.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

          <XAxis
            dataKey="date"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />

          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickFormatter={(value) => value.toLocaleString()}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-sm text-slate-300">{value}</span>
            )}
          />

          {routes.map((route) => (
            <Area
              key={`area-${route.id}`}
              type="monotone"
              dataKey={route.name}
              stroke="transparent"
              fill={`url(#color-${route.id})`}
            />
          ))}

          {routes.map((route) => (
            <Line
              key={route.id}
              type="monotone"
              dataKey={route.name}
              stroke={route.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#0f172a" }}
            />
          ))}

          {chartData.map(
            (entry, index) =>
              entry.hasCancel && (
                <ReferenceDot
                  key={`cancel-${index}`}
                  x={entry.date}
                  y={0}
                  r={0}
                  label={{
                    position: "top",
                    content: () => (
                      <CancelDot
                        cx={0}
                        cy={0}
                        payload={entry}
                        onClick={onCancelClick}
                      />
                    ),
                  }}
                />
              )
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {cancelEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-sm text-slate-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent-500" />
            演出取消事件 ({cancelEvents.length} 起)
          </p>
          <div className="flex flex-wrap gap-2">
            {cancelEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onCancelClick?.(event.performanceId)}
                className="px-3 py-1.5 bg-accent-500/10 border border-accent-500/20 rounded-lg text-xs text-accent-400 hover:bg-accent-500/20 transition-colors"
              >
                {event.date} · {event.performanceName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
