import { Car, CheckCircle, Clock, AlertTriangle, Calendar, TrendingDown, FileText } from "lucide-react"
import { useAppStore } from "@/store"
import KPICard from "@/components/KPICard"
import StoreMap from "@/components/StoreMap"
import TurnoverTrendChart from "@/components/TurnoverTrendChart"
import MaterialHeatmapTable from "@/components/MaterialHeatmapTable"
import MaterialTrendChart from "@/components/MaterialTrendChart"

export default function Dashboard() {
  const dashboardKPI = useAppStore((s) => s.dashboardKPI)

  const kpiTrends = dashboardKPI.kpi_trends
  const latestTrend = kpiTrends[kpiTrends.length - 1]
  const prevTrend = kpiTrends[kpiTrends.length - 2]

  const turnoverTrend = prevTrend
    ? ((latestTrend.turnover_days - prevTrend.turnover_days) / prevTrend.turnover_days) * 100
    : 0

  const completionTrend = prevTrend
    ? ((latestTrend.completion_rate - prevTrend.completion_rate) / prevTrend.completion_rate) * 100
    : 0

  const missingTrend = prevTrend
    ? ((latestTrend.missing_rate - prevTrend.missing_rate) / prevTrend.missing_rate) * 100
    : 0

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            过户材料趋势看板
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            核心复盘库存周转是否改善，追踪过户材料完备性
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
          <Calendar className="h-4 w-4" />
          <span>2025-01 — 2025-12</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <KPICard
          title="在库车辆总数"
          value={dashboardKPI.total_vehicles}
          unit="台"
          trend={3.2}
          icon={<Car className="h-4 w-4" style={{ color: "var(--accent-amber)" }} />}
        />
        <KPICard
          title="过户完成率"
          value={Math.round(dashboardKPI.transfer_completion_rate * 100)}
          unit="%"
          trend={Number(completionTrend.toFixed(1))}
          icon={<CheckCircle className="h-4 w-4" style={{ color: "var(--accent-green)" }} />}
        />
        <KPICard
          title="平均周转天数"
          value={dashboardKPI.avg_turnover_days}
          unit="天"
          trend={Number(turnoverTrend.toFixed(1))}
          inverseTrend={true}
          icon={<Clock className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />}
        />
        <KPICard
          title="材料缺失率"
          value={Math.round(dashboardKPI.material_missing_rate * 100)}
          unit="%"
          trend={Number(missingTrend.toFixed(1))}
          inverseTrend={true}
          icon={<AlertTriangle className="h-4 w-4" style={{ color: "var(--accent-red)" }} />}
        />
      </div>

      <div className="mt-6 flex gap-6">
        <div className="w-[58%]">
          <StoreMap />
        </div>
        <div className="w-[42%]">
          <TurnoverTrendChart />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <MaterialTrendChart />

        <div>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: "var(--accent-amber)" }} />
            <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              材料缺失热力分布
            </h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              点击行可展开查看样本明细
            </span>
          </div>
          <MaterialHeatmapTable />
        </div>
      </div>
    </div>
  )
}
