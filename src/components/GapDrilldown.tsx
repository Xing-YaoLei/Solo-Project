import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { X, AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { useAppStore } from "@/store"
import TestDriveTimeline from "./TestDriveTimeline"

interface GapDrilldownProps {
  open: boolean
  onClose: () => void
}

export default function GapDrilldown({ open, onClose }: GapDrilldownProps) {
  const turnoverGapSamples = useAppStore((s) => s.turnoverGapSamples)
  const setSelectedVehicleId = useAppStore((s) => s.setSelectedVehicleId)
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleViewVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    onClose()
    navigate("/vehicles")
  }

  if (!open) return null

  return (
    <div className="slide-panel card-base fixed right-0 top-0 z-20 flex h-full w-[480px] flex-col overflow-hidden" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border-color)" }}>
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>差距样本明细</div>
        <button onClick={onClose} className="rounded-lg p-1 transition hover:bg-brand-hover">
          <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="space-y-3">
          {turnoverGapSamples.map((sample) => {
            const hasAnomaly = !!sample.test_drive_anomaly
            const isExpanded = expandedId === sample.vehicle_id

            return (
              <div
                key={sample.vehicle_id}
                className="group rounded-lg border p-4 transition hover:border-brand-amber"
                style={{
                  borderColor: hasAnomaly ? "var(--accent-red)" : "var(--border-color)",
                  backgroundColor: hasAnomaly ? "rgba(239,68,68,0.04)" : "transparent",
                }}
              >
                <div
                  className="flex cursor-pointer items-start gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : sample.vehicle_id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs" style={{ color: "var(--text-primary)" }}>{sample.vin}</span>
                      {hasAnomaly && (
                        <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--accent-red)" }} />
                      )}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {sample.model} · {sample.store_name}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="font-mono font-semibold" style={{ color: hasAnomaly ? "var(--accent-red)" : "var(--accent-amber)" }}>
                        {sample.turnover_days}天
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>{sample.gap_reason}</span>
                    </div>
                  </div>
                  {hasAnomaly ? (
                    isExpanded
                      ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                      : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewVehicle(sample.vehicle_id)
                      }}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--accent-amber)", backgroundColor: "var(--accent-amber-dim)" }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      查看档案
                    </button>
                  )}
                </div>

                {isExpanded && sample.test_drive_anomaly && (
                  <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--accent-red)" }}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                      试驾异常详情
                    </div>
                    <TestDriveTimeline records={[sample.test_drive_anomaly]} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
