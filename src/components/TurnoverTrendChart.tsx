import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts"
import { useAppStore } from "@/store"

interface TooltipPayloadItem {
  color: string
  value: number
  dataKey: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload) return null

  const labels: Record<string, string> = {
    current: "当前",
    yoy: "同比",
    mom: "环比",
    target: "目标",
  }

  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      <div className="mb-1.5 font-medium" style={{ color: "var(--text-primary)" }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{labels[item.dataKey] || item.dataKey}</span>
          <span className="ml-auto font-mono font-medium" style={{ color: "var(--text-primary)" }}>{item.value.toFixed(1)} 天</span>
        </div>
      ))}
    </div>
  )
}

export default function TurnoverTrendChart() {
  const turnoverTrends = useAppStore((s) => s.turnoverTrends)

  return (
    <div className="card-base animate-fade-in">
      <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>周转天数趋势</h3>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={turnoverTrends} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a3048" />
          <XAxis dataKey="month" tick={{ fill: "#8b92a8", fontSize: 11 }} axisLine={{ stroke: "#2a3048" }} tickLine={false} />
          <YAxis tick={{ fill: "#8b92a8", fontSize: 11 }} axisLine={{ stroke: "#2a3048" }} tickLine={false} unit="天" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#8b92a8" }}
            formatter={(value: string) => {
              const labels: Record<string, string> = { current: "当前", yoy: "同比", mom: "环比", target: "目标" }
              return labels[value] || value
            }}
          />
          <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <Line type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: "#f59e0b" }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="yoy" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
          <Line type="monotone" dataKey="mom" stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
          <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={1} strokeDasharray="2 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
