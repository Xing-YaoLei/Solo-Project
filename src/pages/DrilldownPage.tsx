import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getAssessmentScales, getTrainingCompletion } from '@/services/api'
import DrilldownBreadcrumb, { type BreadcrumbItem } from '@/components/DrilldownBreadcrumb'
import AssessmentList from '@/components/AssessmentList'
import PrescriptionDetail from '@/components/PrescriptionDetail'
import TreatmentCalendar from '@/components/TreatmentCalendar'
import EquipmentTimeline from '@/components/EquipmentTimeline'
import type { AssessmentScale, TrainingPrescription } from '@/types'

const LEVEL_MAP: Record<string, number> = {
  assessment: 1,
  prescription: 2,
  calendar: 3,
  equipment: 4,
}

const LEVEL_LABELS: Record<number, string> = {
  0: '结算趋势',
  1: '评估量表',
  2: '训练处方',
  3: '治疗日历',
  4: '设备记录',
}

function pickDefaultCalendarMonth(prescriptions: TrainingPrescription[], prescriptionId?: string | null): string {
  if (prescriptionId) {
    const p = prescriptions.find((x) => x.id === prescriptionId)
    if (p && p.startDate) return p.startDate.slice(0, 7)
  }
  const earliest = prescriptions
    .map((p) => p.startDate)
    .filter(Boolean)
    .sort()[0]
  if (earliest) return earliest.slice(0, 7)
  return '2025-03'
}

export default function DrilldownPage() {
  const {
    drilldownLevel,
    setDrilldownLevel,
    selectedPatientId,
    setSelectedPatientId,
    selectedPrescriptionId,
    setSelectedPrescriptionId,
  } = useAppStore()

  const [assessments, setAssessments] = useState<AssessmentScale[]>([])
  const [prescriptions, setPrescriptions] = useState<TrainingPrescription[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState('2025-03')

  useEffect(() => {
    getAssessmentScales().then(setAssessments)
  }, [])

  useEffect(() => {
    getTrainingCompletion().then(setPrescriptions)
  }, [])

  useEffect(() => {
    if (prescriptions.length && !selectedPrescriptionId) {
      setCalendarMonth(pickDefaultCalendarMonth(prescriptions))
    }
  }, [prescriptions, selectedPrescriptionId])

  const currentLevelIndex = LEVEL_MAP[drilldownLevel.level] ?? 1

  const breadcrumbItems: BreadcrumbItem[] = []
  for (let i = 0; i <= currentLevelIndex; i++) {
    breadcrumbItems.push({
      level: i,
      label: LEVEL_LABELS[i],
      id: i === 1 ? selectedAssessmentId ?? undefined
        : i === 2 ? selectedPrescriptionId ?? undefined
        : i === 3 ? calendarMonth
        : i === 4 ? selectedSessionId ?? undefined
        : undefined,
    })
  }

  const navigateToLevel = useCallback((targetIndex: number) => {
    if (targetIndex === 0) {
      setSelectedAssessmentId(null)
      setSelectedPrescriptionId(null)
      setSelectedSessionId(null)
      setDrilldownLevel({ level: 'assessment', label: '评估量表' })
      return
    }

    if (targetIndex < currentLevelIndex) {
      if (targetIndex < 4) setSelectedSessionId(null)
      if (targetIndex < 3) setCalendarMonth(pickDefaultCalendarMonth(prescriptions, selectedPrescriptionId))
      if (targetIndex < 2) {
        setSelectedPrescriptionId(null)
        setSelectedPatientId(null)
      }
      if (targetIndex < 1) setSelectedAssessmentId(null)

      const levelKey = (['assessment', 'prescription', 'calendar', 'equipment'] as const)[targetIndex - 1]
      setDrilldownLevel({ level: levelKey, label: LEVEL_LABELS[targetIndex] })
    }
  }, [currentLevelIndex, prescriptions, selectedPrescriptionId, setDrilldownLevel, setSelectedPatientId, setSelectedPrescriptionId])

  const handleAssessmentSelect = useCallback((assessmentId: string) => {
    const assessment = assessments.find((a) => a.id === assessmentId)
    if (!assessment) return

    setSelectedAssessmentId(assessmentId)
    setSelectedPatientId(assessment.patientId)

    const linkedPrescription = prescriptions.find((p) => p.assessmentId === assessmentId)
    const chosen = linkedPrescription || prescriptions.find((p) => p.patientId === assessment.patientId)

    if (chosen) {
      setSelectedPrescriptionId(chosen.id)
      setCalendarMonth(pickDefaultCalendarMonth(prescriptions, chosen.id))
    } else {
      setSelectedPrescriptionId(null)
    }

    setDrilldownLevel({ level: 'prescription', label: '训练处方' })
  }, [assessments, prescriptions, setSelectedPatientId, setSelectedPrescriptionId, setDrilldownLevel])

  const handleSessionClick = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId)
    setCalendarMonth((prev) => {
      const found = prescriptions.find((p) => p.id === selectedPrescriptionId)
      if (found && found.startDate) return found.startDate.slice(0, 7)
      return prev
    })
    setDrilldownLevel({ level: 'calendar', label: '治疗日历' })
  }, [prescriptions, selectedPrescriptionId, setDrilldownLevel])

  const handleSessionDrill = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId)
    setDrilldownLevel({ level: 'equipment', label: '设备记录' })
  }, [setDrilldownLevel])

  return (
    <div className="px-6 py-4 max-w-[1440px] mx-auto">
      <DrilldownBreadcrumb
        levels={breadcrumbItems}
        onNavigate={navigateToLevel}
      />

      <div className="mt-2">
        {drilldownLevel.level === 'assessment' && (
          <AssessmentList data={assessments} onSelect={handleAssessmentSelect} />
        )}

        {drilldownLevel.level === 'prescription' && selectedPrescriptionId && (
          <PrescriptionDetail
            prescriptionId={selectedPrescriptionId}
            onSessionClick={handleSessionClick}
          />
        )}

        {drilldownLevel.level === 'prescription' && !selectedPrescriptionId && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            未找到关联处方
          </div>
        )}

        {drilldownLevel.level === 'calendar' && selectedPatientId && (
          <TreatmentCalendar
            patientId={selectedPatientId}
            month={calendarMonth}
            prescriptionId={selectedPrescriptionId ?? undefined}
            onSessionDrill={handleSessionDrill}
          />
        )}

        {drilldownLevel.level === 'calendar' && !selectedPatientId && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            未选择患者
          </div>
        )}

        {drilldownLevel.level === 'equipment' && selectedSessionId && (
          <EquipmentTimeline sessionId={selectedSessionId} />
        )}

        {drilldownLevel.level === 'equipment' && !selectedSessionId && (
          <div className="flex items-center justify-center h-64 text-gray-400">
            未选择治疗会话
          </div>
        )}
      </div>
    </div>
  )
}
