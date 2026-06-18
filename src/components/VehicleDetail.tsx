import { useState, useMemo } from "react"
import {
  FileText,
  ClipboardCheck,
  Wrench,
  Car,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Database,
  Cpu,
  Hash,
  Filter,
  Link,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import type { PreparationItem, TestDriveRecord, InspectionItem } from "@/types"

type TabKey = "basic" | "inspection" | "preparation" | "testdrive"
type InspectionFilter = "all" | "pass" | "warning" | "fail"
type PrepFilter = "all" | "pending" | "in_progress" | "completed"

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "basic", label: "基本信息", icon: FileText },
  { key: "inspection", label: "检测报告", icon: ClipboardCheck },
  { key: "preparation", label: "整备清单", icon: Wrench },
  { key: "testdrive", label: "试驾记录", icon: Car },
]

const inspectionStatusConfig = {
  pass: { label: "通过", color: "var(--accent-green)", bg: "var(--accent-green-dim)", Icon: CheckCircle2 },
  warning: { label: "注意", color: "var(--accent-amber)", bg: "var(--accent-amber-dim)", Icon: AlertTriangle },
  fail: { label: "不合格", color: "var(--accent-red)", bg: "var(--accent-red-dim)", Icon: XCircle },
}

const prepStatusConfig: Record<PreparationItem["status"], { label: string; color: string; bg: string }> = {
  pending: { label: "待处理", color: "var(--text-muted)", bg: "var(--bg-hover)" },
  in_progress: { label: "进行中", color: "var(--accent-amber)", bg: "var(--accent-amber-dim)" },
  completed: { label: "已完成", color: "var(--accent-green)", bg: "var(--accent-green-dim)" },
}

const inspectionFilterOptions: { key: InspectionFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pass", label: "通过" },
  { key: "warning", label: "注意" },
  { key: "fail", label: "不合格" },
]

const prepFilterOptions: { key: PrepFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待处理" },
  { key: "in_progress", label: "进行中" },
  { key: "completed", label: "已完成" },
]

type VehicleDetailData = import("@/types").VehicleDetail | null

function BasicInfoTab({ detail }: { detail: NonNullable<VehicleDetailData> }) {
  const fields = [
    { label: "VIN", value: detail.vin },
    { label: "品牌", value: detail.brand },
    { label: "车型", value: detail.model },
    { label: "年份", value: String(detail.year) },
    { label: "里程(km)", value: detail.mileage.toLocaleString() },
    { label: "门店", value: detail.store_name },
    { label: "入库日期", value: detail.entry_date },
    { label: "CRM ID", value: detail.crm_id },
  ]
  return (
    <div className="grid grid-cols-2 gap-4">
      {fields.map((f) => (
        <div key={f.label} className="rounded-lg border p-3" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{f.label}</div>
          <div className="mt-1 font-mono text-sm font-medium" style={{ color: "var(--text-primary)" }}>{f.value}</div>
        </div>
      ))}
    </div>
  )
}

function LinkedPrepBadge({
  task,
  onClick,
}: {
  task: PreparationItem
  onClick: () => void
}) {
  const cfg = prepStatusConfig[task.status]
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-all hover:border-brand-amber"
      style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)", backgroundColor: "var(--bg-primary)" }}
    >
      <Wrench className="h-3 w-3" />
      <span>{task.task_name}</span>
      <ArrowRight className="h-3 w-3" style={{ color: "var(--accent-amber)" }} />
    </button>
  )
}

function InspectionTab({
  detail,
  highlightedItem,
  onHighlightItem,
  onSwitchToPreparation,
  filter,
  onFilterChange,
}: {
  detail: NonNullable<VehicleDetailData>
  highlightedItem: string | null
  onHighlightItem: (itemName: string | null) => void
  onSwitchToPreparation: (taskName?: string) => void
  filter: InspectionFilter
  onFilterChange: (f: InspectionFilter) => void
}) {
  const filteredReports = useMemo(() => {
    if (filter === "all") return detail.inspection_reports
    return detail.inspection_reports.map((report) => ({
      ...report,
      items: report.items.filter((item) => item.status === filter),
    }))
  }, [detail.inspection_reports, filter])

  const getLinkedPrep = (itemName: string): PreparationItem | undefined => {
    return detail.preparation_list.find((p) => p.related_inspection_item === itemName)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Filter className="h-3.5 w-3.5" />
          <span>筛选:</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: "var(--bg-primary)" }}>
          {inspectionFilterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onFilterChange(opt.key)}
              className="rounded-md px-2.5 py-1 text-xs font-medium transition"
              style={{
                backgroundColor: filter === opt.key ? "var(--accent-amber-dim)" : "transparent",
                color: filter === opt.key ? "var(--accent-amber)" : "var(--text-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredReports.map((report) => (
        <div key={report.report_id} className="card-base space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                检测报告 #{report.report_id}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Cpu className="h-3.5 w-3.5" />
              <span className="font-mono">{report.detector_version}</span>
            </div>
          </div>
          <div className="flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>检测师: {report.inspector}</span>
            <span>日期: {report.inspect_date}</span>
          </div>
          <div className="space-y-2">
            {report.items.length === 0 ? (
              <div className="py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                暂无匹配的检测项
              </div>
            ) : (
              report.items.map((item) => {
                const cfg = inspectionStatusConfig[item.status as keyof typeof inspectionStatusConfig]
                const isHighlighted = highlightedItem === item.item_name
                const linkedPrep = getLinkedPrep(item.item_name)

                return (
                  <div
                    key={item.item_name}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 transition-all duration-300",
                      isHighlighted && "ring-1 ring-offset-0"
                    )}
                    style={{
                      borderColor: isHighlighted ? "var(--accent-amber)" : "var(--border-color)",
                      backgroundColor: isHighlighted ? "var(--accent-amber-dim)" : "var(--bg-primary)",
                      boxShadow: isHighlighted ? "0 0 16px rgba(245, 158, 11, 0.25)" : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <cfg.Icon className="h-4 w-4 shrink-0" style={{ color: cfg.color }} />
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{item.item_name}</span>
                        {linkedPrep && (
                          <Link className="h-3 w-3" style={{ color: "var(--accent-amber)" }} />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.detail}</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {linkedPrep && (
                      <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: "var(--border-color)" }}>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Link className="h-3 w-3" style={{ color: "var(--accent-amber)" }} />
                          <span>关联整备任务</span>
                        </div>
                        <LinkedPrepBadge
                          task={linkedPrep}
                          onClick={() => onSwitchToPreparation(linkedPrep.task_id)}
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PreparationTab({
  detail,
  onHighlightInspection,
  highlightedItem,
  onSwitchToInspection,
  filter,
  onFilterChange,
  highlightedTaskId,
}: {
  detail: NonNullable<VehicleDetailData>
  onHighlightInspection: (itemName: string | null) => void
  highlightedItem: string | null
  onSwitchToInspection: (itemName?: string) => void
  filter: PrepFilter
  onFilterChange: (f: PrepFilter) => void
  highlightedTaskId: string | null
}) {
  const filteredTasks = useMemo(() => {
    if (filter === "all") return detail.preparation_list
    return detail.preparation_list.filter((task) => task.status === filter)
  }, [detail.preparation_list, filter])

  const getLinkedInspection = (relatedItem: string): InspectionItem | undefined => {
    if (!relatedItem) return undefined
    for (const report of detail.inspection_reports) {
      const found = report.items.find((i) => i.item_name === relatedItem)
      if (found) return found
    }
    return undefined
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Filter className="h-3.5 w-3.5" />
          <span>筛选:</span>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: "var(--bg-primary)" }}>
          {prepFilterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => onFilterChange(opt.key)}
              className="rounded-md px-2.5 py-1 text-xs font-medium transition"
              style={{
                backgroundColor: filter === opt.key ? "var(--accent-amber-dim)" : "transparent",
                color: filter === opt.key ? "var(--accent-amber)" : "var(--text-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          暂无匹配的整备任务
        </div>
      ) : (
        filteredTasks.map((task) => {
          const cfg = prepStatusConfig[task.status]
          const hasLinked = task.related_inspection_item !== ""
          const linkedInspection = hasLinked ? getLinkedInspection(task.related_inspection_item) : undefined
          const isHighlighted = highlightedTaskId === task.task_id
          const isInspectionHighlighted = highlightedItem === task.related_inspection_item

          return (
            <div
              key={task.task_id}
              className={cn(
                "card-base cursor-pointer transition-all",
                (isHighlighted || isInspectionHighlighted) ? "border-brand-amber ring-1 ring-amber-500/30" : "hover:border-brand-amber"
              )}
              style={{
                borderColor: isHighlighted || isInspectionHighlighted ? "var(--accent-amber)" : undefined,
                boxShadow: isInspectionHighlighted ? "0 0 16px rgba(245, 158, 11, 0.2)" : undefined,
              }}
              onClick={() => {
                if (hasLinked) {
                  onHighlightInspection(
                    highlightedItem === task.related_inspection_item ? null : task.related_inspection_item
                  )
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wrench className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {task.task_name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-hover)" }}
                  >
                    {task.category}
                  </span>
                  {hasLinked && (
                    <Link className="h-3 w-3" style={{ color: "var(--accent-amber)" }} />
                  )}
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="font-mono">费用: ¥{task.cost.toFixed(0)}</span>
                {hasLinked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSwitchToInspection(task.related_inspection_item)
                    }}
                    className="flex items-center gap-1"
                    style={{ color: "var(--accent-amber)" }}
                  >
                    <span>关联检测: {task.related_inspection_item}</span>
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                )}
              </div>

              {linkedInspection && (
                <div className="mt-3 rounded-lg border p-2.5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}>
                  <div className="mb-1.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <ClipboardCheck className="h-3 w-3" style={{ color: "var(--accent-blue)" }} />
                    <span>关联检测结果</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const icfg = inspectionStatusConfig[linkedInspection.status as keyof typeof inspectionStatusConfig]
                        return (
                          <>
                            <icfg.Icon className="h-3.5 w-3.5" style={{ color: icfg.color }} />
                            <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                              {linkedInspection.item_name}
                            </span>
                          </>
                        )
                      })()}
                    </div>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        color: inspectionStatusConfig[linkedInspection.status as keyof typeof inspectionStatusConfig].color,
                        backgroundColor: inspectionStatusConfig[linkedInspection.status as keyof typeof inspectionStatusConfig].bg,
                      }}
                    >
                      {inspectionStatusConfig[linkedInspection.status as keyof typeof inspectionStatusConfig].label}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {linkedInspection.detail}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

function TestDriveTab({ records }: { records: TestDriveRecord[] }) {
  return (
    <div className="relative space-y-0">
      <div
        className="absolute left-[11px] top-2 bottom-2 w-px"
        style={{ backgroundColor: "var(--border-color)" }}
      />
      {records.map((r) => {
        const isAnomaly = r.is_anomaly
        return (
          <div key={r.record_id} className="relative flex gap-4 pb-4 pl-8">
            <div
              className="absolute left-0 top-1.5 flex h-6 w-6 items-center justify-center rounded-full"
              style={{
                backgroundColor: isAnomaly ? "var(--accent-red-dim)" : "var(--bg-hover)",
              }}
            >
              {isAnomaly ? (
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--accent-red)" }} />
              ) : (
                <Car className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div className="flex-1 rounded-lg border p-3" style={{ borderColor: isAnomaly ? "var(--accent-red)" : "var(--border-color)", backgroundColor: isAnomaly ? "var(--accent-red-dim)" : "var(--bg-primary)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {r.driver}
                </span>
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {r.drive_date}
                </span>
              </div>
              <div className="mt-2 flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="font-mono">{r.duration_minutes}分钟</span>
                <span className="font-mono">{r.mileage_km}km</span>
              </div>
              {isAnomaly && r.anomaly_detail && (
                <div
                  className="mt-2 flex items-start gap-1.5 rounded border px-2.5 py-2 text-xs"
                  style={{ borderColor: "var(--accent-red)", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--accent-red)" }}
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{r.anomaly_detail}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function VehicleDetail() {
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const vehicleDetailMap = useAppStore((s) => s.vehicleDetail)

  const [activeTab, setActiveTab] = useState<TabKey>("basic")
  const [highlightedInspectionItem, setHighlightedInspectionItem] = useState<string | null>(null)
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null)
  const [inspectionFilter, setInspectionFilter] = useState<InspectionFilter>("all")
  const [prepFilter, setPrepFilter] = useState<PrepFilter>("all")

  const detail = selectedVehicleId ? vehicleDetailMap[selectedVehicleId] ?? null : null

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Car className="mx-auto h-12 w-12" style={{ color: "var(--text-muted)" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            请选择车辆查看档案
          </p>
        </div>
      </div>
    )
  }

  const handleHighlightInspection = (itemName: string | null) => {
    setHighlightedInspectionItem(itemName)
    if (itemName) {
      setActiveTab("inspection")
    }
  }

  const handleSwitchToInspection = (itemName?: string) => {
    setActiveTab("inspection")
    if (itemName) {
      setHighlightedInspectionItem(itemName)
      setInspectionFilter("all")
    }
  }

  const handleSwitchToPreparation = (taskId?: string) => {
    setActiveTab("preparation")
    if (taskId) {
      setHighlightedTaskId(taskId)
      setTimeout(() => {
        setHighlightedTaskId(null)
      }, 2000)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden animate-fade-in">
      <div className="shrink-0 border-b p-5" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              {detail.brand} {detail.model}
            </h2>
            <p className="mt-1 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {detail.vin}
            </p>
          </div>
          <div className="flex gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>{detail.year}年</span>
            <span className="font-mono">{detail.mileage.toLocaleString()} km</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
          >
            <Database className="h-3.5 w-3.5" style={{ color: "var(--accent-blue)" }} />
            <span style={{ color: "var(--text-muted)" }}>数据源</span>
            <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
              {detail.source_db_version}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
          >
            <Cpu className="h-3.5 w-3.5" style={{ color: "var(--accent-green)" }} />
            <span style={{ color: "var(--text-muted)" }}>检测器</span>
            <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
              {detail.detector_version}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
          >
            <Hash className="h-3.5 w-3.5" style={{ color: "var(--accent-amber)" }} />
            <span style={{ color: "var(--text-muted)" }}>CRM</span>
            <span className="font-mono font-medium" style={{ color: "var(--text-primary)" }}>
              {detail.crm_id}
            </span>
          </div>
          {detail.source_db_version !== detail.detector_version && (
            <div
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--accent-amber)", backgroundColor: "var(--accent-amber-dim)" }}
            >
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--accent-amber)" }} />
              <span style={{ color: "var(--accent-amber)" }}>版本差异</span>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm transition-colors"
            style={{
              borderColor: activeTab === tab.key ? "var(--accent-amber)" : "transparent",
              color: activeTab === tab.key ? "var(--accent-amber)" : "var(--text-secondary)",
            }}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === "basic" && <BasicInfoTab detail={detail} />}
        {activeTab === "inspection" && (
          <InspectionTab
            detail={detail}
            highlightedItem={highlightedInspectionItem}
            onHighlightItem={setHighlightedInspectionItem}
            onSwitchToPreparation={handleSwitchToPreparation}
            filter={inspectionFilter}
            onFilterChange={setInspectionFilter}
          />
        )}
        {activeTab === "preparation" && (
          <PreparationTab
            detail={detail}
            onHighlightInspection={handleHighlightInspection}
            highlightedItem={highlightedInspectionItem}
            onSwitchToInspection={handleSwitchToInspection}
            filter={prepFilter}
            onFilterChange={setPrepFilter}
            highlightedTaskId={highlightedTaskId}
          />
        )}
        {activeTab === "testdrive" && <TestDriveTab records={detail.test_drive_records} />}
      </div>
    </div>
  )
}
