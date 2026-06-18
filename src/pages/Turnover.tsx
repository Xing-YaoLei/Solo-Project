import { useState, useMemo } from "react"
import { TrendingDown, TrendingUp, Minus, Target, PanelRightOpen, Calendar, AlertTriangle, Clock, CheckCircle, Car } from "lucide-react"
import { useAppStore } from "@/store"
import TurnoverComparisonChart from "@/components/TurnoverComparisonChart"
import GapDrilldown from "@/components/GapDrilldown"
import TestDriveTimeline from "@/components/TestDriveTimeline"
import KPICard from "@/components/KPICard"

export default function Turnover() {
  const turnoverComparisons = useAppStore((s) => s.turnoverComparisons)
  const turnoverGapSamples = useAppStore((s) => s.turnoverGapSamples)
  const turnoverTimeRange = useAppStore((s) => s.turnoverTimeRange)
  const [drilldownOpen, setDrilldownOpen] = useState(false)
  const [gapFilter, setGapFilter] = useState<"all" | "material" | "inspection" | "testdrive">("all")

  const filteredComparisons = useMemo(() => {
    return turnoverTimeRange === "6m"
      ? turnoverComparisons.slice(-6)
      : turnoverComparisons
  }, [turnoverComparisons, turnoverTimeRange])

  const latest = filteredComparisons[filteredComparisons.length - 1]
  const previous = filteredComparisons[filteredComparisons.length - 2]

  const avgCurrent = (filteredComparisons.reduce((s, c) => s + c.current_value, 0) / filteredComparisons.length).toFixed(1)
  const avgYoy = (filteredComparisons.reduce((s, c) => s + c.yoy_value, 0) / filteredComparisons.length).toFixed(1)
  const avgMom = (filteredComparisons.reduce((s, c) => s + c.mom_value, 0) / filteredComparisons.length).toFixed(1)
  const target = latest?.target_value ?? 20

  const allDriveRecords = turnoverGapSamples
    .filter((s) => s.test_drive_anomaly)
    .map((s) => s.test_drive_anomaly!)

  const filteredGapSamples = useMemo(() => {
    if (gapFilter === "all") return turnoverGapSamples
    if (gapFilter === "testdrive") return turnoverGapSamples.filter((s) => s.test_drive_anomaly)
    if (gapFilter === "material") return turnoverGapSamples.filter((s) => s.gap_reason.includes("材料") || s.gap_reason.includes("登记证"))
    if (gapFilter === "inspection") return turnoverGapSamples.filter((s) => s.gap_reason.includes("检测") || s.gap_reason.includes("整备"))
    return turnoverGapSamples
  }, [turnoverGapSamples, gapFilter])

  const gapStats = useMemo(() => {
    const total = turnoverGapSamples.length
    const withAnomaly = turnoverGapSamples.filter((s) => s.test_drive_anomaly).length
    const materialRelated = turnoverGapSamples.filter((s) => s.gap_reason.includes("材料") || s.gap_reason.includes("登记证")).length
    const inspectionRelated = turnoverGapSamples.filter((s) => s.gap_reason.includes("检测") || s.gap_reason.includes("整备")).length
    return { total, withAnomaly, materialRelated, inspectionRelated }
  }, [turnoverGapSamples])

  const monthOverMonthChange = previous
    ? ((latest.current_value - previous.current_value) / previous.current_value) * 100
    : 0

  const yearOverYearChange = latest
    ? ((latest.current_value - latest.yoy_value) / latest.yoy_value) * 100
    : 0

  const targetGap = latest ? latest.current_value - target : 0

  return (
    <div className="relative h-full p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              库存周转分析
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              同比、环比与目标值对比，核心复盘周转是否改善
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
            <Calendar className="h-4 w-4" />
            <span>2025-01 — 2025-12</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 animate-fade-in">
          <KPICard
            title="当期平均周转"
            value={Number(avgCurrent)}
            unit="天"
            trend={Number(monthOverMonthChange.toFixed(1))}
            inverseTrend={true}
            icon={<Clock className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />}
          />
          <KPICard
            title="同比平均"
            value={Number(avgYoy)}
            unit="天"
            trend={Number((((Number(avgCurrent) - Number(avgYoy)) / Number(avgYoy)) * 100).toFixed(1))}
            inverseTrend={true}
            icon={<TrendingUp className="h-4 w-4" style={{ color: "var(--accent-amber)" }} />}
          />
          <KPICard
            title="环比平均"
            value={Number(avgMom)}
            unit="天"
            trend={Number((((Number(avgCurrent) - Number(avgMom)) / Number(avgMom)) * 100).toFixed(1))}
            inverseTrend={true}
            icon={<TrendingDown className="h-4 w-4" style={{ color: "var(--accent-green)" }} />}
          />
          <KPICard
            title="目标值"
            value={target}
            unit="天"
            trend={Number(targetGap.toFixed(1))}
            inverseTrend={true}
            icon={<Target className="h-4 w-4" style={{ color: "var(--accent-red)" }} />}
          />
        </div>

        <TurnoverComparisonChart />

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="card-base animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    差距原因分布
                  </h3>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    共 {gapStats.total} 台超目标车辆
                  </p>
                </div>
                <button
                  onClick={() => setDrilldownOpen(!drilldownOpen)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:bg-brand-hover"
                  style={{ color: "var(--accent-amber)", border: "1px solid var(--border-color)" }}
                >
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  {drilldownOpen ? "收起明细" : "查看明细"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-red-dim)" }}>
                      <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--accent-red)" }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>试驾异常</div>
                      <div className="font-mono text-lg font-bold" style={{ color: "var(--accent-red)" }}>
                        {gapStats.withAnomaly}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> 台</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-amber-dim)" }}>
                      <Car className="h-3.5 w-3.5" style={{ color: "var(--accent-amber)" }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>材料缺失</div>
                      <div className="font-mono text-lg font-bold" style={{ color: "var(--accent-amber)" }}>
                        {gapStats.materialRelated}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> 台</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-blue-dim)" }}>
                      <CheckCircle className="h-3.5 w-3.5" style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>检测/整备</div>
                      <div className="font-mono text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
                        {gapStats.inspectionRelated}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}> 台</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span>筛选:</span>
                </div>
                <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: "var(--bg-primary)" }}>
                  {[
                    { key: "all", label: "全部" },
                    { key: "material", label: "材料缺失" },
                    { key: "inspection", label: "检测整备" },
                    { key: "testdrive", label: "试驾异常" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setGapFilter(opt.key as typeof gapFilter)}
                      className="rounded-md px-3 py-1 text-xs font-medium transition"
                      style={{
                        backgroundColor: gapFilter === opt.key ? "var(--accent-amber-dim)" : "transparent",
                        color: gapFilter === opt.key ? "var(--accent-amber)" : "var(--text-muted)",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 max-h-[240px] space-y-2 overflow-y-auto">
                {filteredGapSamples.slice(0, 8).map((sample) => {
                  const hasAnomaly = !!sample.test_drive_anomaly
                  return (
                    <div
                      key={sample.vehicle_id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 transition hover:border-brand-amber"
                      style={{
                        borderColor: hasAnomaly ? "var(--accent-red)" : "var(--border-color)",
                        backgroundColor: hasAnomaly ? "rgba(239,68,68,0.04)" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{sample.vin}</span>
                        <span className="text-xs" style={{ color: "var(--text-primary)" }}>{sample.model}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sample.gap_reason}</span>
                        <span
                          className="font-mono text-sm font-semibold"
                          style={{ color: hasAnomaly ? "var(--accent-red)" : "var(--accent-amber)" }}
                        >
                          {sample.turnover_days}天
                        </span>
                      </div>
                    </div>
                  )
                })}
                {filteredGapSamples.length === 0 && (
                  <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                    暂无符合条件的样本
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="card-base animate-fade-in h-full">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  试驾异常时间线
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {allDriveRecords.length} 条记录
                </span>
              </div>
              {allDriveRecords.length > 0 ? (
                <div className="max-h-[360px] overflow-y-auto">
                  <TestDriveTimeline records={allDriveRecords} />
                </div>
              ) : (
                <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  暂无试驾异常记录
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <GapDrilldown open={drilldownOpen} onClose={() => setDrilldownOpen(false)} />
    </div>
  )
}
