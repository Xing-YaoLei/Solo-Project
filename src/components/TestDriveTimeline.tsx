import type { TestDriveRecord } from "@/types"

interface TestDriveTimelineProps {
  records: TestDriveRecord[]
}

export default function TestDriveTimeline({ records }: TestDriveTimelineProps) {
  return (
    <div className="relative pl-5">
      <div
        className="absolute left-1.5 top-1 bottom-1 w-px"
        style={{ backgroundColor: "var(--border-color)" }}
      />
      {records.map((r) => {
        const isAnomaly = r.is_anomaly
        return (
          <div key={r.record_id} className="relative mb-4 last:mb-0">
            <div
              className="absolute -left-[13px] top-1 h-2.5 w-2.5 rounded-full border-2"
              style={{
                borderColor: isAnomaly ? "var(--accent-red)" : "var(--text-muted)",
                backgroundColor: isAnomaly ? "var(--accent-red)" : "var(--bg-card)",
              }}
            />
            <div
              className="rounded-lg border p-3"
              style={{
                borderColor: isAnomaly ? "var(--accent-red)" : "var(--border-color)",
                backgroundColor: isAnomaly ? "rgba(239,68,68,0.06)" : "transparent",
              }}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono" style={{ color: isAnomaly ? "var(--accent-red)" : "var(--text-secondary)" }}>
                  {r.drive_date}
                </span>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <span style={{ color: "var(--text-secondary)" }}>{r.driver}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span style={{ color: "var(--text-muted)" }}>
                  时长 <span className="font-mono" style={{ color: "var(--text-primary)" }}>{r.duration_minutes}min</span>
                </span>
                <span style={{ color: "var(--text-muted)" }}>
                  里程 <span className="font-mono" style={{ color: "var(--text-primary)" }}>{r.mileage_km}km</span>
                </span>
              </div>
              {isAnomaly && r.anomaly_detail && (
                <div className="mt-2 rounded-md px-2 py-1.5 text-xs" style={{ backgroundColor: "var(--accent-red-dim)", color: "var(--accent-red)" }}>
                  {r.anomaly_detail}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
