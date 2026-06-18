import { Fragment, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react"
import { useAppStore } from "@/store"
import type { MaterialHeatmap } from "@/types"

function getRateBg(rate: number) {
  if (rate < 0.05) return "rgba(16, 185, 129, 0.2)"
  if (rate < 0.15) return "rgba(245, 158, 11, 0.2)"
  return "rgba(239, 68, 68, 0.2)"
}

function getRateColor(rate: number) {
  if (rate < 0.05) return "var(--accent-green)"
  if (rate < 0.15) return "var(--accent-amber)"
  return "var(--accent-red)"
}

function RateCell({ rate }: { rate: number }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium"
      style={{ backgroundColor: getRateBg(rate), color: getRateColor(rate) }}
    >
      {(rate * 100).toFixed(1)}%
    </span>
  )
}

function ExpandedRow({ item }: { item: MaterialHeatmap }) {
  const navigate = useNavigate()
  const setSelectedVehicleId = useAppStore((s) => s.setSelectedVehicleId)

  const handleSampleClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    navigate("/vehicles")
  }

  return (
    <tr>
      <td colSpan={4} className="px-5 py-3" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="flex flex-col gap-2">
          {item.samples.map((sample) => (
            <div
              key={sample.vehicle_id}
              className="group flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-2 text-xs transition-all hover:border-brand-amber hover:shadow-md"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
              onClick={() => handleSampleClick(sample.vehicle_id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono" style={{ color: "var(--text-secondary)" }}>{sample.vin}</span>
                <span style={{ color: "var(--text-primary)" }}>{sample.model}</span>
              </div>
              <div className="flex gap-1">
                {sample.missing_items.map((mi) => (
                  <span key={mi} className="rounded px-1.5 py-0.5" style={{ backgroundColor: "var(--accent-red-dim)", color: "var(--accent-red)" }}>
                    {mi}
                  </span>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-xs" style={{ color: "var(--accent-amber)" }}>查看档案</span>
                <ExternalLink className="h-3 w-3" style={{ color: "var(--accent-amber)" }} />
              </div>
            </div>
          ))}
        </div>
      </td>
    </tr>
  )
}

export default function MaterialHeatmapTable() {
  const materialHeatmap = useAppStore((s) => s.materialHeatmap)
  const setSelectedMaterialType = useAppStore((s) => s.setSelectedMaterialType)
  const setSelectedStoreName = useAppStore((s) => s.setSelectedStoreName)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (item: MaterialHeatmap) => {
    const key = `${item.material_type}-${item.store_name}`
    setExpandedId(expandedId === key ? null : key)
    setSelectedMaterialType(item.material_type)
    setSelectedStoreName(item.store_name)
  }

  return (
    <div className="card-base animate-fade-in overflow-hidden">
      <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>材料缺失热力表</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>材料类型</th>
              <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>门店</th>
              <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>缺失数量</th>
              <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>缺失率</th>
            </tr>
          </thead>
          <tbody>
            {materialHeatmap.map((item) => {
              const key = `${item.material_type}-${item.store_name}`
              const isExpanded = expandedId === key
              return (
                <Fragment key={key}>
                  <tr
                    className="cursor-pointer transition-colors duration-150"
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    onClick={() => toggleExpand(item)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} /> : <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />}
                        <span style={{ color: "var(--text-primary)" }}>{item.material_type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--text-secondary)" }}>{item.store_name}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--text-primary)" }}>{item.missing_count}</td>
                    <td className="px-5 py-3"><RateCell rate={item.missing_rate} /></td>
                  </tr>
                  {isExpanded && <ExpandedRow item={item} />}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-4 px-5 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: "rgba(16, 185, 129, 0.3)" }} /> &lt;5%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: "rgba(245, 158, 11, 0.3)" }} /> 5%-15%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.3)" }} /> &gt;15%
        </span>
      </div>
    </div>
  )
}
