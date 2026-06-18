import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from "recharts"
import { useAppStore } from "@/store"
import { TrendingDown, TrendingUp } from "lucide-react"

const MATERIAL_COLORS: Record<string, string> = {
  "登记证": "#f59e0b",
  "行驶证": "#3b82f6",
  "购车发票": "#10b981",
  "保险单": "#8b5cf6",
  "完税证明": "#ef4444",
}

interface TooltipPayloadItem {
  color: string
  value: number
  dataKey: string
  payload: Record<string, unknown>
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div
      className="rounded-lg px-3 py-2.5 text-xs shadow-lg"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", minWidth: "160px" }}
    >
      <div className="mb-2 font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </div>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span style={{ color: "var(--text-secondary)" }}>{item.dataKey}</span>
            <span className="ml-auto font-mono font-medium" style={{ color: "var(--text-primary)" }}>
              {(item.value * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MaterialTrendChart() {
  const materialTrendPoints = useAppStore((s) => s.materialTrendPoints)
  const fetchMaterialTrend = useAppStore((s) => s.fetchMaterialTrend)
  const [chartType, setChartType] = useState<"line" | "area">("line")

  useEffect(() => {
    void fetchMaterialTrend()
  }, [fetchMaterialTrend])

  const materialTypes = ["登记证", "行驶证", "购车发票", "保险单", "完税证明"] as const

  const detailedTrendData = materialTrendPoints.map((p) => ({
    month: p.month.slice(5),
    "登记证": p["登记证"],
    "行驶证": p["行驶证"],
    "购车发票": p["购车发票"],
    "保险单": p["保险单"],
    "完税证明": p["完税证明"],
  }))

  const latestData = detailedTrendData[detailedTrendData.length - 1]
  const previousData = detailedTrendData[detailedTrendData.length - 2]

  return (
    <div className="card-base animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            过户材料缺失趋势
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            各类材料缺失率月度变化（来自车源库+检测仪版本）
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: "var(--bg-primary)" }}>
          <button
            onClick={() => setChartType("line")}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition"
            style={{
              backgroundColor: chartType === "line" ? "var(--accent-amber-dim)" : "transparent",
              color: chartType === "line" ? "var(--accent-amber)" : "var(--text-muted)",
            }}
          >
            折线图
          </button>
          <button
            onClick={() => setChartType("area")}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition"
            style={{
              backgroundColor: chartType === "area" ? "var(--accent-amber-dim)" : "transparent",
              color: chartType === "area" ? "var(--accent-amber)" : "var(--text-muted)",
            }}
          >
            面积图
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-5 gap-2">
        {materialTypes.map((type) => {
          const latestVal = latestData ? ((latestData as unknown) as Record<string, number>)[type] ?? 0 : 0
          const prevVal = previousData ? ((previousData as unknown) as Record<string, number>)[type] ?? 0 : 0
          const change = prevVal !== 0 ? ((latestVal - prevVal) / prevVal) * 100 : 0
          const isImproving = latestVal < prevVal

          return (
            <div
              key={type}
              className="rounded-lg border p-2.5 transition-all hover:border-brand-amber"
              style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: MATERIAL_COLORS[type] }}
                />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {type}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span
                  className="font-mono text-base font-bold"
                  style={{ color: MATERIAL_COLORS[type] }}
                >
                  {(latestVal * 100).toFixed(1)}%
                </span>
                <span
                  className="flex items-center gap-0.5 text-[10px]"
                  style={{ color: isImproving ? "var(--accent-green)" : "var(--accent-red)" }}
                >
                  {isImproving ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {chartType === "line" ? (
          <LineChart data={detailedTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3048" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#8b92a8", fontSize: 11 }}
              axisLine={{ stroke: "#2a3048" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8b92a8", fontSize: 11 }}
              axisLine={{ stroke: "#2a3048" }}
              tickLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#8b92a8", paddingTop: "8px" }}
              iconType="circle"
            />
            {materialTypes.map((type, idx) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                stroke={MATERIAL_COLORS[type]}
                strokeWidth={idx === 1 ? 2.5 : 1.8}
                dot={{ r: 2.5, fill: MATERIAL_COLORS[type], strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "#0f1219" }}
              />
            ))}
          </LineChart>
        ) : (
          <AreaChart data={detailedTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              {materialTypes.map((type) => (
                <linearGradient key={type} id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MATERIAL_COLORS[type]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={MATERIAL_COLORS[type]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3048" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#8b92a8", fontSize: 11 }}
              axisLine={{ stroke: "#2a3048" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8b92a8", fontSize: 11 }}
              axisLine={{ stroke: "#2a3048" }}
              tickLine={false}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#8b92a8", paddingTop: "8px" }}
              iconType="circle"
            />
            {materialTypes.map((type) => (
              <Area
                key={type}
                type="monotone"
                dataKey={type}
                stroke={MATERIAL_COLORS[type]}
                strokeWidth={1.8}
                fill={`url(#gradient-${type})`}
                dot={false}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
