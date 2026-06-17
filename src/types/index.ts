export interface SettlementTrend {
  period: string
  totalAmount: number
  rejectedAmount: number
  rejectionRate: number
  completionRate: number
}

export interface SettlementSummary {
  totalAmount: number
  rejectedAmount: number
  rejectionRate: number
  completionRate: number
  totalAmountChange: number
  rejectedAmountChange: number
  rejectionRateChange: number
  completionRateChange: number
}

export interface AssessmentScale {
  id: string
  patientId: string
  patientName: string
  scaleName: string
  score: number
  previousScore: number
  assessedAt: string
  hasLinkedPrescription: boolean
}

export interface TrainingPrescription {
  id: string
  patientId: string
  assessmentId: string
  prescriptionName: string
  totalSessions: number
  completedSessions: number
  completionRate: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'expired'
}

export interface TreatmentCalendarDay {
  date: string
  scheduledCount: number
  completedCount: number
  missedCount: number
  rejectedCount: number
  details: TreatmentSession[]
}

export interface EquipmentRecordBrief {
  id: string
  equipmentName: string
  parameters: Record<string, number | string> | null
  duration: number | null
  recordDate: string
}

export interface TreatmentSession {
  id: string
  time: string
  projectName: string
  therapistName: string
  status: 'completed' | 'missed' | 'rejected' | 'scheduled'
  prescriptionId?: string
  equipmentRecords: EquipmentRecordBrief[]
}

export interface EquipmentRecord {
  id: string
  sessionId: string
  equipmentName: string
  parameters: Record<string, number | string> | null
  duration: number | null
  recordDate: string
  patientName?: string
  therapistName?: string
  treatmentDate?: string
  projectName?: string
}

export interface RejectionRecord {
  id: string
  settlementId: string
  patientId: string
  patientName: string
  rejectedAmount: number
  rejectionReason: string
  rejectionDate: string
  remarkTask?: RemarkTask
}

export interface RemarkTask {
  id: string
  rejectionId: string
  assignee: string
  status: 'pending' | 'processing' | 'resolved'
  conclusion?: string
  createdAt: string
  resolvedAt?: string
}

export interface SavedView {
  id: string
  name: string
  owner: string
  isShared: boolean
  filters: ViewFilters
  createdAt: string
}

export interface ViewFilters {
  dateRange: [string, string]
  department?: string
  therapist?: string
  patientId?: string
  completionRateRange?: [number, number]
  rejectionStatus?: string
}

export interface DrilldownLevel {
  level: 'assessment' | 'prescription' | 'calendar' | 'equipment'
  label: string
}
