import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTreatmentCalendar } from '@/services/api'
import type { TreatmentCalendarDay, TreatmentSession } from '@/types'

interface TreatmentCalendarProps {
  patientId: string
  month: string
  prescriptionId?: string
  onSessionDrill: (sessionId: string) => void
}

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const SESSION_STATUS_MAP: Record<TreatmentSession['status'], { label: string; dot: string }> = {
  completed: { label: '完成', dot: 'bg-green-500' },
  missed: { label: '缺席', dot: 'bg-red-500' },
  rejected: { label: '拒付', dot: 'bg-amber-500' },
  scheduled: { label: '待定', dot: 'bg-gray-400' },
}

function getDayCellBg(day: TreatmentCalendarDay | undefined): string {
  if (!day || day.scheduledCount === 0) return 'bg-white'
  if (day.missedCount > 0) return 'bg-red-50'
  if (day.rejectedCount > 0) return 'bg-amber-50'
  if (day.completedCount === day.scheduledCount) return 'bg-green-50'
  return 'bg-white'
}

export default function TreatmentCalendar({ patientId, month, prescriptionId, onSessionDrill }: TreatmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month)
  const [calendarData, setCalendarData] = useState<TreatmentCalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<TreatmentCalendarDay | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSelectedDay(null)
    setCurrentMonth(month)
    getTreatmentCalendar(patientId, month, prescriptionId).then((data) => {
      if (cancelled) return
      setCalendarData(data)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [patientId, month, prescriptionId])

  const calendarGrid = useMemo(() => {
    const [yearStr, monthStr] = currentMonth.split('-')
    const year = Number(yearStr)
    const mon = Number(monthStr) - 1
    const firstDay = new Date(year, mon, 1)
    const daysInMonth = new Date(year, mon + 1, 0).getDate()
    let startWeekday = firstDay.getDay()
    startWeekday = startWeekday === 0 ? 6 : startWeekday - 1

    const dayMap = new Map<string, TreatmentCalendarDay>()
    for (const d of calendarData) {
      dayMap.set(d.date, d)
    }

    const cells: (TreatmentCalendarDay & { dayNum: number } | null)[] = []
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(mon + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayData = dayMap.get(dateStr)
      cells.push({
        ...(dayData ?? { date: dateStr, scheduledCount: 0, completedCount: 0, missedCount: 0, rejectedCount: 0, details: [] }),
        dayNum: d,
      })
    }
    const remainder = cells.length % 7
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null)
      }
    }
    return cells
  }, [calendarData, currentMonth])

  function navigateMonth(delta: number) {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split('-')
    return `${y}年${Number(m)}月`
  }, [currentMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
    )
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" />
            <h3 className="font-semibold text-gray-800">治疗日历</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">{monthLabel}</span>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="px-2 py-2 text-center text-xs font-medium text-gray-500">
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarGrid.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="min-h-[90px] border-b border-r border-gray-50 bg-gray-50/50" />
            }
            const isToday = cell.date === new Date().toISOString().slice(0, 10)
            const isSelected = selectedDay?.date === cell.date

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDay(cell)}
                className={cn(
                  'min-h-[90px] border-b border-r border-gray-50 p-1.5 text-left transition-colors',
                  getDayCellBg(cell),
                  isSelected && 'ring-2 ring-inset ring-teal-400',
                  cell.scheduledCount > 0 ? 'cursor-pointer hover:bg-teal-50/50' : 'cursor-default',
                )}
              >
                <div className={cn(
                  'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  isToday ? 'bg-teal-600 text-white' : 'text-gray-700',
                )}>
                  {cell.dayNum}
                </div>
                {cell.scheduledCount > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-500">{cell.scheduledCount}项</p>
                    <div className="flex gap-1 flex-wrap">
                      {cell.completedCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-green-700 bg-green-50 px-1 rounded">
                          <span className="w-1 h-1 rounded-full bg-green-500" />
                          {cell.completedCount}
                        </span>
                      )}
                      {cell.missedCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-red-700 bg-red-50 px-1 rounded">
                          <span className="w-1 h-1 rounded-full bg-red-500" />
                          {cell.missedCount}
                        </span>
                      )}
                      {cell.rejectedCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1 rounded">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                          {cell.rejectedCount}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h4 className="font-semibold text-gray-800">{selectedDay.date}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              共 {selectedDay.scheduledCount} 项 · 完成 {selectedDay.completedCount}
            </p>
          </div>
          <div className="divide-y divide-gray-50 overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {selectedDay.details.map((session) => (
              <div
                key={session.id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onSessionDrill(session.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{session.projectName}</span>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    SESSION_STATUS_MAP[session.status].dot.replace('bg-', 'bg-').replace('500', '50'),
                    session.status === 'completed' && 'text-green-700 bg-green-50',
                    session.status === 'missed' && 'text-red-700 bg-red-50',
                    session.status === 'rejected' && 'text-amber-700 bg-amber-50',
                    session.status === 'scheduled' && 'text-gray-600 bg-gray-100',
                  )}>
                    {SESSION_STATUS_MAP[session.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{session.time}</span>
                  <span>{session.therapistName}</span>
                </div>
                {session.equipmentRecords && session.equipmentRecords.length > 0 && (
                  <p className="text-[10px] text-teal-600 mt-1">
                    关联设备: {session.equipmentRecords.map((e) => e.equipmentName).join(', ')} →
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
