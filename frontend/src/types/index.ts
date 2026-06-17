export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface FunnelData {
  stage: string;
  value: number;
  rate: number;
}

export interface CoreMetrics {
  bedOccupancy: number;
  careComplianceRate: number;
  riskEventCount: number;
  activityParticipationRate: number;
  bedOccupancyChange: number;
  careComplianceChange: number;
  riskEventChange: number;
  activityChange: number;
}

export interface ActivityTrendItem {
  date: string;
  participationRate: number;
  participantCount: number;
}

export interface ActivityTimeDistribution {
  timeSlot: string;
  count: number;
}

export interface BedAreaComparison {
  area: string;
  totalResidents: number;
  participantCount: number;
  participationRate: number;
}

export interface RiskEvent {
  id: string;
  type: string;
  level: string;
  residentName: string;
  bedNo: string;
  occurTime: string;
  description: string;
  remark: string | null;
  remarkTime: string | null;
  remarkUser: string | null;
}

export interface RiskTypeDistribution {
  type: string;
  count: number;
  ratio: number;
}

export interface RiskDailyTrend {
  date: string;
  total: number;
  fall: number;
  pressure_ulcer: number;
  wandering: number;
  medication_error: number;
  other: number;
}

export interface RiskEventListResponse {
  list: RiskEvent[];
  total: number;
}

export interface ResidentProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  careLevel: string;
  bedNo: string;
  admissionDate: string;
  primaryDisease: string;
}

export interface BedUtilization {
  area: string;
  totalBeds: number;
  occupiedBeds: number;
  utilizationRate: number;
}

export interface CareLevelDistribution {
  careLevel: string;
  count: number;
  ratio: number;
}

export interface AgeDistribution {
  ageGroup: string;
  count: number;
}

export interface DiseaseDistribution {
  disease: string;
  count: number;
  ratio: number;
}

export interface ThresholdConfig {
  id: string;
  metricKey: string;
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ThresholdChangeLog {
  id: string;
  metricName: string;
  oldWarning: number;
  newWarning: number;
  oldCritical: number;
  newCritical: number;
  changedBy: string;
  changedAt: string;
}

export interface ReviewTimelineItem {
  time: string;
  type: string;
  description: string;
}

export interface CareComplianceData {
  beforeEvent: {
    rate: number;
    totalTasks: number;
    completedTasks: number;
  };
  afterEvent: {
    rate: number;
    totalTasks: number;
    completedTasks: number;
  };
  periodDays: number;
}

export interface ReviewRemark {
  id: string;
  content: string;
  user: string;
  time: string;
  type: string;
}

export interface FallReview {
  eventId: string;
  eventInfo: RiskEvent;
  timeline: ReviewTimelineItem[];
  careCompliance: CareComplianceData;
  remarks: ReviewRemark[];
}

export interface FallEventSummary {
  id: string;
  residentName: string;
  bedNo: string;
  occurTime: string;
  level: string;
}
