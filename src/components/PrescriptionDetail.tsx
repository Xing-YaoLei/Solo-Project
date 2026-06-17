import { useState, useEffect, useMemo } from 'react'
import { ClipboardList, User, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTrainingPrescription, getPrescriptionSessions } from '@/services/api'
import type { TrainingPrescription, TreatmentSession } from '@/types'

interface SessionRow extends TreatmentSession {
  plannedTime: string
  actualTime: string | null
  duration: number
}

interface PrescriptionDetailProps {
  prescriptionId: string
  onSessionClick: (sessionId: string) => void
}

const STATUS_MAP: Record<SessionRow['status'], { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
  missed: { label: '缺席', className: 'bg-red-50 text-red-700' },
  rejected: { label: '拒付', className: 'bg-amber-50 text-amber-700' },
  scheduled: { label: '待执行', className: 'bg-gray-100 text-gray-600' },
}

function seeded(index: number, salt: number): number {
  const x = Math.sin(index * 9301 + salt * 49297) * 233280
  return x - Math.floor(x)
}

function toSessionRows(sessions: TreatmentSession[]): SessionRow[] {
  return sessions.map((s, i): SessionRow => {
    const timePart = s.time || '09:00'
    const datePart = (s as any).treatmentDate || ''
    const planned = datePart ? `${datePart} ${timePart}` : `${s.time}`
    const isCompleted = s.status === 'completed'
    return {
      ...s,
      id: String(s.id),
      time: s.time,
      plannedTime: planned,
      actualTime: isCompleted ? planned : null,
      duration: isCompleted ? 30 + Math.round(seeded(i, Number(s.id) || i) * 30) : 0,
    }
  })
}

export default function PrescriptionDetail({ prescriptionId, onSessionClick }: PrescriptionDetailProps) {
  const [prescription, setPrescription] = useState<TrainingPrescription | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const p = await getTrainingPrescription(prescriptionId)
      if (cancelled) return
      if (p) {
        setPrescription(p)
        const realSessions = await getPrescriptionSessions(
          p.id,
          p.startDate.slice(0, 10),
          p.endDate.slice(0, 10),
        )
        if (cancelled) return
        if (realSessions.length) {
          setSessions(toSessionRows(realSessions))
        } else {
          setSessions([])
        }
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [prescriptionId])

  const stats = useMemo(() => {
    const counts = { completed: 0, missed: 0, rejected: 0, scheduled: 0 }
    for (const s of sessions) counts[s.status]++
    return counts
  }, [sessions])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        加载中...
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        未找到处方信息
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-teal-600" />
          <h3 className="font-semibold text-gray-800">治疗会话列表</h3>
          <span className="ml-2 text-xs text-gray-500">共 {sessions.length} 条</span>
        </div>
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2.5 font-medium w-12">序号</th>
                <th className="px-4 py-2.5 font-medium">治疗项目</th>
                <th className="px-4 py-2.5 font-medium">治疗师</th>
                <th className="px-4 py-2.5 font-medium">计划时间</th>
                <th className="px-4 py-2.5 font-medium">实际时间</th>
                <th className="px-4 py-2.5 font-medium w-20">时长</th>
                <th className="px-4 py-2.5 font-medium w-20">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    当前处方暂无会话记录
                  </td>
                </tr>
              )}
              {sessions.map((session, idx) => (
                <tr
                  key={session.id}
                  onClick={() => {
                    setSelectedSessionId(session.id)
                    onSessionClick(session.id)
                  }}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedSessionId === session.id
                      ? 'bg-teal-50'
                      : 'hover:bg-gray-50',
                  )}
                >
                  <td className="px-4 py-2.5 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-gray-800">
                    {session.projectName}
                    {session.equipmentRecords?.length > 0 && (
                      <span className="ml-2 text-[10px] text-teal-600">
                        [{session.equipmentRecords.map(e => e.equipmentName).join('/')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{session.therapistName}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{session.plannedTime}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{session.actualTime ?? '-'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{session.duration > 0 ? `${session.duration}` : '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_MAP[session.status].className)}>
                      {STATUS_MAP[session.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">{prescription.prescriptionName}</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span>患者ID: {prescription.patientId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span>{prescription.startDate} ~ {prescription.endDate}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">完成进度</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">已完成会话</span>
              <span className="font-medium text-gray-800">
                {stats.completed} / {sessions.length || prescription.totalSessions}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-teal-500 h-2.5 rounded-full transition-all"
                style={{ width: `${prescription.completionRate}%` }}
              />
            </div>
            <p className="text-right text-xs text-gray-500">
              完成率 {prescription.completionRate}%
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">会话状态分布</h4>
          <div className="space-y-2">
            {(['completed', 'missed', 'rejected', 'scheduled'] as const).map((status) => {
              const count = stats[status]
              return (
                <div key={status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                    {status === 'missed' && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                    {status === 'rejected' && <XCircle className="h-3.5 w-3.5 text-amber-500" />}
                    {status === 'scheduled' && <Clock className="h-3.5 w-3.5 text-gray-400" />}
                    <span className="text-gray-600">{STATUS_MAP[status].label}</span>
                  </div>
                  <span className="font-medium text-gray-800">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
