import { useState, useMemo } from "react"
import { Search, ChevronDown } from "lucide-react"
import { useAppStore } from "@/store"
import { cn } from "@/lib/utils"
import type { VehicleListItem } from "@/types"

const statusConfig: Record<VehicleListItem["status"], { label: string; color: string; bg: string }> = {
  in_stock: { label: "在库", color: "var(--accent-blue)", bg: "var(--accent-blue-dim)" },
  transfer_processing: { label: "过户中", color: "var(--accent-amber)", bg: "var(--accent-amber-dim)" },
  transferred: { label: "已过户", color: "var(--accent-green)", bg: "var(--accent-green-dim)" },
  sold: { label: "已售", color: "var(--text-muted)", bg: "var(--bg-hover)" },
}

const statusOptions: { value: VehicleListItem["status"] | "all"; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "in_stock", label: "在库" },
  { value: "transfer_processing", label: "过户中" },
  { value: "transferred", label: "已过户" },
  { value: "sold", label: "已售" },
]

export default function VehicleList() {
  const vehicleList = useAppStore((s) => s.vehicleList)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const setSelectedVehicleId = useAppStore((s) => s.setSelectedVehicleId)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<VehicleListItem["status"] | "all">("all")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const filtered = useMemo(() => {
    return vehicleList.filter((v) => {
      const matchSearch =
        search === "" ||
        v.vin.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.brand.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || v.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [vehicleList, search, statusFilter])

  const currentStatusLabel =
    statusOptions.find((o) => o.value === statusFilter)?.label ?? "全部状态"

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="space-y-3 border-b p-4" style={{ borderColor: "var(--border-color)" }}>
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)" }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 VIN / 车型"
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-primary)", color: "var(--text-secondary)" }}
          >
            {currentStatusLabel}
            <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
          </button>
          {dropdownOpen && (
            <div
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border shadow-lg"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
            >
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value as VehicleListItem["status"] | "all")
                    setDropdownOpen(false)
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-brand-hover"
                  style={{
                    color: statusFilter === opt.value ? "var(--accent-amber)" : "var(--text-secondary)",
                    backgroundColor: statusFilter === opt.value ? "var(--accent-amber-dim)" : undefined,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            无匹配车辆
          </div>
        )}
        {filtered.map((v) => {
          const cfg = statusConfig[v.status]
          const isSelected = selectedVehicleId === v.vehicle_id
          return (
            <div
              key={v.vehicle_id}
              onClick={() => setSelectedVehicleId(v.vehicle_id)}
              className={cn(
                "cursor-pointer border-b px-4 py-3 transition-colors",
                isSelected ? "bg-brand-hover" : "hover:bg-brand-hover"
              )}
              style={{
                borderColor: "var(--border-color)",
                borderLeftWidth: isSelected ? "3px" : "0px",
                borderLeftColor: isSelected ? "var(--accent-amber)" : "transparent",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {v.vin}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="mt-1.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {v.brand} {v.model}
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                <span>{v.store_name}</span>
                <span className="font-mono">
                  {v.entry_date}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>周转</span>
                <span className="font-mono font-semibold" style={{ color: v.turnover_days > 25 ? "var(--accent-red)" : "var(--text-primary)" }}>
                  {v.turnover_days}天
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="border-t px-4 py-2.5 text-xs"
        style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
      >
        共 {filtered.length} 辆车
      </div>
    </div>
  )
}
