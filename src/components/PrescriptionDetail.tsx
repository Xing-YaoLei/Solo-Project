import { useState, useEffect } from 'react'
import { ClipboardList, User, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTrainingPrescription } from '@/services/api'
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

const THERAPIST_NAMES = ['王晓峰', '刘静', '张伟', '陈丽华', '赵明']
const STATUS_MAP: Record<SessionRow['status'], { label: string; className: string }> = {
  completed: { label: '已完成', className: 'bg-green-50 text-green-700' },
  missed: { label: '缺席', className: 'bg-red-50 text-red-700' },
  rejected: { label: '拒付', className: 'bg-amber-50 text-amber-700' },
  scheduled: { label: '待执行', className: 'bg-gray-100 text-gray-600' },
}

function buildSessionRows(prescription: TrainingPrescription): SessionRow[] {
  const rows: SessionRow[] = []
  const start = new Date(prescription.startDate)
  const completed = prescription.completedSessions
  const total = prescription.totalSessions

  for (let i = 0; i < total; i++) {
    const sessionDate = new Date(start)
    sessionDate.setDate(sessionDate.getDate() + i * 2)
    const dateStr = sessionDate.toISOString().slice(0, 10)
    const hour = 8 + (i % 5) * 2
    const planned = `${dateStr} ${String(hour).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`

    let status: SessionRow['status']
    if (i < completed - 1) {
      status = 'completed'
    } else if (i === completed - 1) {
      status = Math.random() > 0.3 ? 'completed' : 'missed'
    } else if (i < completed + 2) {
      status = Math.random() > 0.5 ? 'missed' : 'rejected'
    } else {
      status = 'scheduled'
    }

    rows.push({
      id: `TS_${prescription.id}_${i + 1}`,
      time: planned,
      projectName: prescription.prescriptionName,
      therapistName: THERAPIST_NAMES[i % THERAPIST_NAMES.length],
      status,
      plannedTime: planned,
      actualTime: status === 'completed' ? planned : status === 'scheduled' ? null : null,
      duration: status === 'completed' ? 30 + (i % 4) * 5 : 0,
      equipmentId: status === 'completed' && Math.random() > 0.5 ? `EQ${(i % 10) + 1}` : undefined,
    })
  }

  return rows
}

export default function PrescriptionDetail({ prescriptionId, onSessionClick }: PrescriptionDetailProps) {
  const [prescription, setPrescription] = useState<TrainingPrescription | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getTrainingPrescription(prescriptionId).then((data) => {
      if (cancelled) return
      if (data) {
        setPrescription(data)
        setSessions(buildSessionRows(data))
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [prescriptionId])

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
                  <td className="px-4 py-2.5 text-gray-800">{session.projectName}</td>
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
                {prescription.completedSessions} / {prescription.totalSessions}
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
              const count = sessions.filter((s) => s.status === status).length
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
