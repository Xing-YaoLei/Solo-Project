'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReminders, bulkCheck } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import StatusBadge from '@/components/StatusBadge'
import CareLevelBadge from '@/components/CareLevelBadge'
import { CheckCircle2, Clock, Filter, X, AlertTriangle, CheckCircle, Users, XCircle } from 'lucide-react'
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

interface BulkCheckResult {
  totalElders: number
  matchedCount: number
  mismatchCount: number
  mismatches: Array<{
    elderId: string
    elderName: string
    roomNumber: string
    careLevel: string
    fallRiskLevel: string
    medicationCount: number
    issues: string[]
  }>
}

export default function MedicationsPage() {
  const { selectedDate, setSelectedDate } = useAppStore()
  const [shift, setShift] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [checkResult, setCheckResult] = useState<BulkCheckResult | null>(null)
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
    onSuccess: (data) => {
      setCheckResult(data as BulkCheckResult)
      setShowResult(true)
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })

  const grouped = reminders.reduce((acc: Record<string, any[]>, r: any) => {
    const time = format(r.scheduledTime)
    if (!acc[time]) acc[time] = []
    acc[time].push(r)
    return acc
  }, {})

  const sortedTimes = Object.keys(grouped).sort()

  return (
    <div className="relative">
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
          {bulkMutation.isPending ? '核对中...' : '批量核对'}
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

      {showResult && checkResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  checkResult.mismatchCount === 0 ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {checkResult.mismatchCount === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">批量核对结果</h3>
                  <p className="text-sm text-slate-500">{selectedDate} {shift ? (shiftOptions.find(s => s.value === shift)?.label) : '全部班次'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowResult(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mb-1">
                  <Users className="w-4 h-4" />
                  核对人数
                </div>
                <div className="text-2xl font-bold text-slate-800">{checkResult.totalElders}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 text-sm mb-1">
                  <CheckCircle className="w-4 h-4" />
                  核对通过
                </div>
                <div className="text-2xl font-bold text-green-600">{checkResult.matchedCount}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600 text-sm mb-1">
                  <XCircle className="w-4 h-4" />
                  存在问题
                </div>
                <div className="text-2xl font-bold text-amber-600">{checkResult.mismatchCount}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {checkResult.mismatchCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-slate-600 font-medium">所有老人用药核对通过</p>
                  <p className="text-sm text-slate-400 mt-1">护理等级与用药清单匹配，无异常情况</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    不匹配老人列表
                  </h4>
                  {checkResult.mismatches.map((m) => (
                    <div
                      key={m.elderId}
                      className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-semibold">
                            {m.elderName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{m.elderName}</div>
                            <div className="text-xs text-slate-500">{m.roomNumber} · {m.medicationCount} 种用药</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CareLevelBadge level={m.careLevel} />
                          <StatusBadge status={m.fallRiskLevel} variant="risk" />
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {m.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowResult(false)}
                className="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors"
              >
                关闭
              </button>
              {checkResult.mismatchCount > 0 && (
                <button
                  onClick={() => setShowResult(false)}
                  className="px-5 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors"
                >
                  继续处理
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
