import { Check, X, Filter } from "lucide-react"
import { useAppStore } from "@/store"

const sourceBadge: Record<string, { label: string; color: string; bg: string }> = {
  vehicle_source: { label: "车源库", color: "var(--accent-blue)", bg: "var(--accent-blue-dim)" },
  detector: { label: "检测仪", color: "var(--accent-amber)", bg: "var(--accent-amber-dim)" },
  crm: { label: "CRM", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
}

export default function DiffTable() {
  const diffRecords = useAppStore((s) => s.diffRecords)
  const diffFilterSource = useAppStore((s) => s.diffFilterSource)
  const diffFilterResolved = useAppStore((s) => s.diffFilterResolved)
  const setDiffFilterSource = useAppStore((s) => s.setDiffFilterSource)
  const setDiffFilterResolved = useAppStore((s) => s.setDiffFilterResolved)

  const filtered = diffRecords
    .filter((r) => !diffFilterSource || r.source === diffFilterSource)
    .filter((r) => {
      if (!diffFilterResolved) return true
      if (diffFilterResolved === "resolved") return r.resolved
      return !r.resolved
    })
    .sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())

  return (
    <div className="card-base animate-fade-in flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Filter className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <select
          value={diffFilterSource ?? ""}
          onChange={(e) => setDiffFilterSource(e.target.value || null)}
          className="rounded-lg border px-3 py-1.5 text-xs outline-none transition"
          style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          <option value="">全部来源</option>
          <option value="vehicle_source">车源库</option>
          <option value="detector">检测仪</option>
          <option value="crm">CRM</option>
        </select>
        <select
          value={diffFilterResolved ?? ""}
          onChange={(e) => setDiffFilterResolved(e.target.value || null)}
          className="rounded-lg border px-3 py-1.5 text-xs outline-none transition"
          style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          <option value="">全部状态</option>
          <option value="resolved">已解决</option>
          <option value="pending">待处理</option>
        </select>
        <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
          {filtered.length} 条记录
        </span>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr style={{ color: "var(--text-muted)" }}>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">VIN</th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">字段</th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">源值</th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">CRM值</th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">来源</th>
              <th className="whitespace-nowrap pb-3 pr-4 font-medium">检测时间</th>
              <th className="whitespace-nowrap pb-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const badge = sourceBadge[r.source]
              return (
                <tr
                  key={r.diff_id}
                  className="border-t transition-colors hover:bg-brand-hover"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <td className="whitespace-nowrap py-3 pr-4 font-mono" style={{ color: "var(--text-primary)" }}>{r.vin}</td>
                  <td className="whitespace-nowrap py-3 pr-4" style={{ color: "var(--text-secondary)" }}>{r.field_name}</td>
                  <td className="whitespace-nowrap py-3 pr-4 font-mono" style={{ color: "var(--text-primary)" }}>{r.source_value}</td>
                  <td className="whitespace-nowrap py-3 pr-4 font-mono" style={{ color: "var(--text-secondary)" }}>{r.crm_value}</td>
                  <td className="whitespace-nowrap py-3 pr-4">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 font-mono" style={{ color: "var(--text-muted)" }}>
                    {new Date(r.detected_at).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="whitespace-nowrap py-3">
                    {r.resolved ? (
                      <Check className="h-4 w-4" style={{ color: "var(--accent-green)" }} />
                    ) : (
                      <X className="h-4 w-4" style={{ color: "var(--accent-red)" }} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
