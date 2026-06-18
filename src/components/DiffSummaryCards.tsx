import { GitCompare, Cpu, CheckCircle } from "lucide-react"
import { useAppStore } from "@/store"

export default function DiffSummaryCards() {
  const diffSummary = useAppStore((s) => s.diffSummary)
  const { source_vs_crm, detector_version_diff } = diffSummary
  const resolvedPct = source_vs_crm.total > 0 ? (source_vs_crm.resolved / source_vs_crm.total) * 100 : 0

  return (
    <div className="grid grid-cols-3 gap-5 animate-fade-in">
      <div className="card-base flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-blue-dim)" }}>
          <GitCompare className="h-5 w-5" style={{ color: "var(--accent-blue)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>车源库 vs CRM</div>
          <div className="mt-1 font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{source_vs_crm.total}</div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--accent-green)" }}>已解决 {source_vs_crm.resolved}</span>
              <span style={{ color: "var(--accent-amber)" }}>待处理 {source_vs_crm.pending}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border-color)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${resolvedPct}%`, backgroundColor: "var(--accent-green)" }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card-base flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-amber-dim)" }}>
          <Cpu className="h-5 w-5" style={{ color: "var(--accent-amber)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>检测仪版本差异</div>
          <div className="mt-1 font-mono text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{detector_version_diff.total}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {detector_version_diff.versions.map((v) => (
              <span
                key={v.version}
                className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono"
                style={{ backgroundColor: "var(--accent-amber-dim)", color: "var(--accent-amber)" }}
              >
                {v.version} ({v.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="card-base flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-green-dim)" }}>
          <CheckCircle className="h-5 w-5" style={{ color: "var(--accent-green)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>已解决/待处理</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold" style={{ color: "var(--accent-green)" }}>{source_vs_crm.resolved}</span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>/</span>
            <span className="font-mono text-2xl font-bold" style={{ color: "var(--accent-amber)" }}>{source_vs_crm.pending}</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent-green)" }} />
              <span style={{ color: "var(--text-muted)" }}>已解决 {Math.round(resolvedPct)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent-amber)" }} />
              <span style={{ color: "var(--text-muted)" }}>待处理 {Math.round(100 - resolvedPct)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
