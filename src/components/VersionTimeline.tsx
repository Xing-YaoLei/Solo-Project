import { useAppStore } from "@/store"

export default function VersionTimeline() {
  const versions = useAppStore((s) => s.diffSummary.detector_version_diff.versions)

  return (
    <div className="card-base animate-fade-in">
      <div className="mb-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>检测仪版本变更</div>
      <div className="relative pl-6">
        <div
          className="absolute left-2 top-1 bottom-1 w-px"
          style={{ backgroundColor: "var(--accent-amber)" }}
        />
        {versions.map((v, i) => (
          <div key={v.version} className="relative mb-6 last:mb-0">
            <div
              className="absolute -left-4 top-0.5 h-4 w-4 rounded-full border-2"
              style={{
                borderColor: "var(--accent-amber)",
                backgroundColor: i === versions.length - 1 ? "var(--accent-amber)" : "var(--bg-card)",
              }}
            />
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold" style={{ color: "var(--accent-amber)" }}>{v.version}</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {new Date(v.change_date).toLocaleDateString("zh-CN")}
              </span>
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              影响车辆 <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{v.count}</span> 台
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {v.affected_stores.map((store) => (
                <span
                  key={store}
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs"
                  style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
                >
                  {store}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
