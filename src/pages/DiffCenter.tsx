import DiffSummaryCards from "@/components/DiffSummaryCards"
import VersionTimeline from "@/components/VersionTimeline"
import DiffTable from "@/components/DiffTable"

export default function DiffCenter() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <DiffSummaryCards />
      <div className="flex min-h-0 flex-1 gap-6">
        <div className="w-1/3 shrink-0">
          <VersionTimeline />
        </div>
        <div className="w-2/3 min-w-0">
          <DiffTable />
        </div>
      </div>
    </div>
  )
}
