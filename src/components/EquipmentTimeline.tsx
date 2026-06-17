import { useState, useEffect } from 'react'
import { Cpu, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { getEquipmentRecord } from '@/services/api'
import type { EquipmentRecord } from '@/types'

interface EquipmentTimelineProps {
  sessionId: string
}

export default function EquipmentTimeline({ sessionId }: EquipmentTimelineProps) {
  const [record, setRecord] = useState<EquipmentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getEquipmentRecord(sessionId).then((data) => {
      if (cancelled) return
      setRecord(data ?? null)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
    )
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <Cpu className="h-8 w-8 text-gray-300" />
        <p className="text-sm">暂无设备记录</p>
      </div>
    )
  }

  const paramEntries = Object.entries(record.parameters)

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />

        <div className="relative">
          <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-teal-100" />

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-teal-600" />
                <h3 className="font-semibold text-gray-800">{record.equipmentName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 transition-colors"
                >
                  {expanded ? (
                    <>收起 <ChevronUp className="h-3.5 w-3.5" /></>
                  ) : (
                    <>展开 <ChevronDown className="h-3.5 w-3.5" /></>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {record.recordedAt}
              </span>
              <span>时长: {record.duration}分钟</span>
            </div>

            {expanded && paramEntries.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 mb-2">设备参数</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {paramEntries.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-500">{key}</span>
                      <span className="text-sm font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
