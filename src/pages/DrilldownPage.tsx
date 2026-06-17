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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    getAssessmentScales().then(setAssessments)
  }, [])

  useEffect(() => {
    getTrainingCompletion().then(setPrescriptions)
  }, [])

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
      if (targetIndex < 3) setCalendarMonth(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
      if (targetIndex < 2) {
        setSelectedPrescriptionId(null)
        setSelectedPatientId(null)
      }
      if (targetIndex < 1) setSelectedAssessmentId(null)

      const levelKey = (['assessment', 'prescription', 'calendar', 'equipment'] as const)[targetIndex - 1]
      setDrilldownLevel({ level: levelKey, label: LEVEL_LABELS[targetIndex] })
    }
  }, [currentLevelIndex, setDrilldownLevel, setSelectedPatientId, setSelectedPrescriptionId])

  const handleAssessmentSelect = useCallback((assessmentId: string) => {
    const assessment = assessments.find((a) => a.id === assessmentId)
    if (!assessment) return

    setSelectedAssessmentId(assessmentId)
    setSelectedPatientId(assessment.patientId)

    const linkedPrescription = prescriptions.find((p) => p.assessmentId === assessmentId)
    if (linkedPrescription) {
      setSelectedPrescriptionId(linkedPrescription.id)
    } else {
      const byPatient = prescriptions.find((p) => p.patientId === assessment.patientId)
      setSelectedPrescriptionId(byPatient?.id ?? null)
    }

    setDrilldownLevel({ level: 'prescription', label: '训练处方' })
  }, [assessments, prescriptions, setSelectedPatientId, setSelectedPrescriptionId, setDrilldownLevel])

  const handleSessionClick = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId)
    setDrilldownLevel({ level: 'calendar', label: '治疗日历' })
  }, [setDrilldownLevel])

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
