'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { getReminders, updateReminderStatus } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Pill, Clock, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react'
import { format } from '@/app/helpers'

const shifts = [
  { key: 'MORNING' as const, label: '早班' },
  { key: 'AFTERNOON' as const, label: '午班' },
  { key: 'EVENING' as const, label: '晚班' },
]

export default function HomePage() {
  const { currentShift, setCurrentShift, selectedDate, setSelectedDate } =
    useAppStore()
  const queryClient = useQueryClient()

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', currentShift, selectedDate],
    queryFn: () =>
      getReminders({ shift: currentShift, date: selectedDate }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateReminderStatus(id, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  })

  const handleStatus = (id: string, status: string) => {
    statusMutation.mutate({ id, status })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {shifts.map((s) => (
            <button
              key={s.key}
              onClick={() => setCurrentShift(s.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                currentShift === s.key
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          当前班次暂无用药提醒
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r: any, i: number) => (
            <div
              key={r.id}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {r.elder?.name ?? '未知'}
                      </span>
                      <span className="text-sm text-slate-400">
                        {r.elder?.roomNumber ?? ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-600">
                        {r.medicationName} {r.dosage}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {format(r.scheduledTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} variant="reminder" />
                  {r.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatus(r.id, 'COMPLETED')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-teal-700 text-white text-xs font-medium hover:bg-teal-800 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        完成
                      </button>
                      <button
                        onClick={() => handleStatus(r.id, 'ADVERSE_REACTION')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        异常
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
