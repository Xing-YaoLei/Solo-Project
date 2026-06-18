import VehicleList from "@/components/VehicleList"
import VehicleDetail from "@/components/VehicleDetail"

export default function Vehicles() {
  return (
    <div className="flex h-full gap-0 p-6">
      <div className="w-[380px] shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
        <VehicleList />
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-card)" }}>
        <VehicleDetail />
      </div>
    </div>
  )
}
