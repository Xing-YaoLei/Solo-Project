'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { FUNNEL_STAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { FunnelStage, FunnelStageKey } from '@/lib/types'

interface ConclusionSidebarProps {
  stages: FunnelStage[]
  selectedStage: FunnelStageKey | null
  onSelectStage: (stage: FunnelStageKey) => void
}

const ConclusionSidebar: React.FC<ConclusionSidebarProps> = ({
  stages,
  selectedStage,
  onSelectStage,
}) => {
  const [expandedStages, setExpandedStages] = useState<Set<FunnelStageKey>>(
    new Set(selectedStage ? [selectedStage] : [])
  )

  const toggleStage = (key: FunnelStageKey) => {
    setExpandedStages((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    onSelectStage(key)
  }

  return (
    <div className="space-y-2">
      <h3 className="mb-3 text-sm font-bold text-navy-900">处理结论</h3>
      {FUNNEL_STAGES.map((stageDef) => {
        const stageData = stages.find((s) => s.stage === stageDef.key)
        const isExpanded = expandedStages.has(stageDef.key)
        const isActive = selectedStage === stageDef.key

        return (
          <div
            key={stageDef.key}
            className={cn(
              'rounded-lg border transition-colors',
              isActive
                ? 'border-amber-400 bg-amber-50'
                : 'border-slate-200 bg-white'
            )}
          >
            <button
              onClick={() => toggleStage(stageDef.key)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stageDef.color }} />
                <span className="text-sm font-medium text-navy-900">{stageDef.label}</span>
                <span className="font-mono text-xs text-slate-500">({stageData?.count ?? 0})</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-amber-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
            {isExpanded && stageData?.conclusions && (
              <div className="border-t border-slate-100 px-3 py-2">
                {stageData.conclusions.map((conclusion, idx) => (
                  <div key={idx} className="mb-2 last:mb-0">
                    <p className="text-xs font-medium text-navy-900">{conclusion.summary}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{conclusion.detail}</p>
                  </div>
                ))}
                {stageData.conclusions.length === 0 && (
                  <p className="text-xs text-slate-400">暂无处理结论</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ConclusionSidebar
