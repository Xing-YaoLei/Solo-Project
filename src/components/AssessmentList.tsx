import { useState } from 'react'
import { Search, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentScale } from '@/types'

interface AssessmentListProps {
  data: AssessmentScale[]
  onSelect: (assessmentId: string) => void
}

export default function AssessmentList({ data, onSelect }: AssessmentListProps) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? data.filter((a) => a.patientName.includes(search.trim()))
    : data

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索患者姓名..."
          className="w-full max-w-sm pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const scoreUp = item.score >= item.previousScore
          const scoreDiff = Math.abs(item.score - item.previousScore)

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md hover:border-teal-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{item.scaleName}</span>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    item.hasLinkedPrescription
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  {item.hasLinkedPrescription ? '已关联处方' : '未关联处方'}
                </span>
              </div>

              <div className="mb-2">
                <p className="text-sm text-gray-800 font-medium">{item.patientName}</p>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{item.score}</span>
                  <span className="text-xs text-gray-400">分</span>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-sm font-medium',
                    scoreUp ? 'text-green-600' : 'text-red-500',
                  )}
                >
                  {scoreUp ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{scoreDiff}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">评估日期: {item.assessedAt}</p>
              </div>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">未找到匹配的评估量表记录</div>
      )}
    </div>
  )
}
