export type RiskAnnotationType =
  | 'terminal_delay'
  | 'access_missing'
  | 'billing_caliber_change'
  | 'fall_event';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface RiskAnnotation {
  id: string;
  type: RiskAnnotationType;
  timestamp: string;
  description: string;
  severity: Severity;
  metadata: Record<string, unknown>;
}

export interface ReviewNote {
  id: string;
  annotationId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface ScheduleTrendData {
  date: string;
  occupancyRate: number;
  riskScore: number;
  bedCount: number;
  occupiedCount: number;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

export interface MedicationRecord {
  id: string;
  elderId: string;
  elderName: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  actualTime: string | null;
  status: 'completed' | 'delayed' | 'missed';
  terminalDelay?: number;
}

export interface VisitRecord {
  id: string;
  elderId: string;
  elderName: string;
  visitorName: string;
  visitorRelation: string;
  visitTime: string;
  leaveTime: string | null;
  accessStatus: 'recorded' | 'missing_entry' | 'missing_exit';
  missingPeriod?: { start: string; end: string };
}

export interface ActivityRecord {
  id: string;
  activityName: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: Array<{
    elderId: string;
    elderName: string;
    checkInTime: string | null;
    status: 'checked_in' | 'absent';
  }>;
}

export interface FallEvent {
  id: string;
  elderId: string;
  elderName: string;
  timestamp: string;
  location: string;
  severity: Severity;
  description: string;
}

export interface BillingCaliberChange {
  id: string;
  timestamp: string;
  previousCaliber: string;
  newCaliber: string;
  affectedBeds: number;
  description: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  category: string;
  threshold: number;
  unit: string;
  description: string;
}

export interface ExportRequest {
  startDate: string;
  endDate: string;
  viewType: 'schedule_trend' | 'medication' | 'visits' | 'activities';
  format: 'csv' | 'xlsx';
  includeComplianceRules: boolean;
}
