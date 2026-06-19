import { useEffect } from 'react'
import { Clock, CheckCircle2, XCircle, Trophy, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRecordsStore } from '@/stores/useRecordsStore'
import type { TrainingRecord } from '@/types/training'

interface RecordListProps {
  onSelectRecord?: (record: TrainingRecord) => void
}

export default function RecordList({ onSelectRecord }: RecordListProps) {
  const records = useRecordsStore((s) => s.records)
  const fetchRecords = useRecordsStore((s) => s.fetchRecords)

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}分${seconds}秒`
  }

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3 w-3" />
          通过
        </span>
      )
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" />
          未通过
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        {status}
      </span>
    )
  }

  const getLevelName = (levelId: string) => {
    const map: Record<string, string> = {
      'level-1': '新手入门',
      'level-2': '进阶挑战',
      'level-3': '精英考核',
    }
    return map[levelId] || levelId
  }

  const getLevelColor = (levelId: string) => {
    const map: Record<string, string> = {
      'level-1': 'bg-emerald-100 text-emerald-700',
      'level-2': 'bg-blue-100 text-blue-700',
      'level-3': 'bg-purple-100 text-purple-700',
    }
    return map[levelId] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="rounded-xl bg-white shadow-sm">
      <div className="border-b border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900">训练记录</h3>
        <p className="mt-0.5 text-xs text-gray-500">共 {records.length} 次训练</p>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center">
          <Clock className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">暂无训练记录</p>
          <p className="mt-1 text-xs text-gray-400">完成训练后记录将在此显示</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {records.map((record) => (
            <button
              key={record.id}
              onClick={() => onSelectRecord?.(record)}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition-all',
                'hover:bg-gray-50',
                onSelectRecord && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                  getLevelColor(record.levelId)
                )}
              >
                <Trophy className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {getLevelName(record.levelId)}
                  </span>
                  {getStatusBadge(record.status)}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(record.startTime)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(record.startTime, record.endTime)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-indigo-600">{record.score}</span>
                <span className="text-xs text-gray-500">
                  准时率 {record.onTimeRate}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
