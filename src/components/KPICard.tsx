import { TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  title: string
  value: number
  unit: string
  trend: number
  icon: React.ReactNode
  inverseTrend?: boolean
}

export default function KPICard({ title, value, unit, trend, icon, inverseTrend = false }: KPICardProps) {
  const isUp = trend >= 0
  const isPositive = inverseTrend ? !isUp : isUp
  const trendColor = isPositive ? "var(--accent-green)" : "var(--accent-red)"
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  return (
    <div className="card-base animate-fade-in group cursor-default transition-shadow duration-300 hover:glow-amber">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {title}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-amber-dim)" }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {unit}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <TrendIcon className="h-3.5 w-3.5" style={{ color: trendColor }} />
        <span className="font-mono text-xs font-medium" style={{ color: trendColor }}>
          {isUp ? "+" : ""}{trend.toFixed(1)}%
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          较上月
        </span>
      </div>
    </div>
  )
}
