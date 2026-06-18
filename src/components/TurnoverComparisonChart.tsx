import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { useAppStore } from "@/store"

export default function TurnoverComparisonChart() {
  const turnoverComparisons = useAppStore((s) => s.turnoverComparisons)
  const turnoverTimeRange = useAppStore((s) => s.turnoverTimeRange)
  const setTurnoverTimeRange = useAppStore((s) => s.setTurnoverTimeRange)

  const data = turnoverTimeRange === "6m"
    ? turnoverComparisons.slice(-6)
    : turnoverComparisons

  return (
    <div className="card-base animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>周转天数对比</div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: "var(--bg-primary)" }}>
          <button
            onClick={() => setTurnoverTimeRange("6m")}
            className="rounded-md px-3 py-1 text-xs font-medium transition"
            style={{
              backgroundColor: turnoverTimeRange === "6m" ? "var(--accent-amber-dim)" : "transparent",
              color: turnoverTimeRange === "6m" ? "var(--accent-amber)" : "var(--text-muted)",
            }}
          >
            近6月
          </button>
          <button
            onClick={() => setTurnoverTimeRange("12m")}
            className="rounded-md px-3 py-1 text-xs font-medium transition"
            style={{
              backgroundColor: turnoverTimeRange === "12m" ? "var(--accent-amber-dim)" : "transparent",
              color: turnoverTimeRange === "12m" ? "var(--accent-amber)" : "var(--text-muted)",
            }}
          >
            近12月
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barGap={2} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3048" />
          <XAxis
            dataKey="period"
            tick={{ fill: "#8b92a8", fontSize: 11 }}
            axisLine={{ stroke: "#2a3048" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#8b92a8", fontSize: 11 }}
            axisLine={{ stroke: "#2a3048" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e2435",
              border: "1px solid #2a3048",
              borderRadius: 8,
              color: "#e8eaf0",
              fontSize: 12,
            }}
            labelStyle={{ color: "#8b92a8", marginBottom: 4 }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                current_value: "当期",
                yoy_value: "同比",
                mom_value: "环比",
              }
              return [`${value} 天`, labels[name] ?? name]
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#8b92a8" }}
          />
          <ReferenceLine
            y={20}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: "目标 20天", fill: "#ef4444", fontSize: 11, position: "right" }}
          />
          <Bar dataKey="current_value" fill="#3b82f6" radius={[3, 3, 0, 0]} name="当期" />
          <Bar dataKey="yoy_value" fill="#f59e0b" radius={[3, 3, 0, 0]} name="同比" />
          <Line
            type="monotone"
            dataKey="mom_value"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: "#10b981" }}
            name="环比"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
