'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReminders, bulkCheck } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import StatusBadge from '@/components/StatusBadge'
import { CheckCircle2, Clock, Filter } from 'lucide-react'
import { format } from '@/app/helpers'

const shiftOptions = [
  { value: '', label: '全部班次' },
  { value: 'MORNING', label: '早班' },
  { value: 'AFTERNOON', label: '午班' },
  { value: 'EVENING', label: '晚班' },
]

const statusColors: Record<string, string> = {
  PENDING: 'border-l-slate-300 bg-slate-50',
  IN_PROGRESS: 'border-l-teal-500 bg-teal-50/30',
  COMPLETED: 'border-l-green-500 bg-green-50/30',
  MISSED: 'border-l-red-500 bg-red-50/30',
  ADVERSE_REACTION: 'border-l-red-600 bg-red-50/50',
  REFUSED: 'border-l-orange-500 bg-orange-50/30',
}

export default function MedicationsPage() {
  const { selectedDate, setSelectedDate } = useAppStore()
  const [shift, setShift] = useState('')
  const queryClient = useQueryClient()

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', shift, selectedDate],
    queryFn: () => {
      const params: Record<string, string> = { date: selectedDate }
      if (shift) params.shift = shift
      return getReminders(params)
    },
  })

  const bulkMutation = useMutation({
    mutationFn: () => bulkCheck({ date: selectedDate, shift: shift || undefined }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const grouped = reminders.reduce((acc: Record<string, any[]>, r: any) => {
    const time = format(r.scheduledTime)
    if (!acc[time]) acc[time] = []
    acc[time].push(r)
    return acc
  }, {})

  const sortedTimes = Object.keys(grouped).sort()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {shiftOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => bulkMutation.mutate()}
          disabled={bulkMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          批量核对
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : sortedTimes.length === 0 ? (
        <div className="text-center py-20 text-slate-400">暂无用药提醒</div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-6">
            {sortedTimes.map((time) => (
              <div key={time} className="relative flex gap-6">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="mt-1 text-xs font-mono font-medium text-slate-500">
                    {time}
                  </span>
                </div>
                <div className="flex-1 space-y-2 pb-4">
                  {grouped[time].map((r: any) => (
                    <div
                      key={r.id}
                      className={`rounded-xl p-4 shadow-sm border-l-4 ${
                        statusColors[r.status] ?? 'border-l-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-800">
                            {r.elder?.name ?? '未知'}
                          </span>
                          <span className="text-sm text-slate-400 ml-2">
                            {r.elder?.roomNumber ?? ''}
                          </span>
                          <span className="text-sm text-slate-600 ml-3">
                            {r.medicationName} {r.dosage}
                          </span>
                        </div>
                        <StatusBadge status={r.status} variant="reminder" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
