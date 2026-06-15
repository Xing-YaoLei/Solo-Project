export interface KPIData {
  totalApplications: number;
  passedApplications: number;
  passRate: number;
  missingMaterials: number;
  classroomUtilization: number;
  utilizationYoY: number;
  utilizationMoM: number;
  totalStudents: number;
  pendingReviews: number;
}

export interface TrendDataPoint {
  month: string;
  applications: number;
  passed: number;
  missingMaterials: number;
  gapAmount: number;
  isAnomaly: boolean;
  anomalyReason?: string;
  supervisorQuotaImpact?: {
    expected: number;
    actual: number;
  };
}

export interface MultiSourceData {
  studentId: string;
  studentName: string;
  studentNo: string;
  courseCode: string;
  application: {
    score: number;
    applyTime: string;
    status: string;
  };
  campusCard: {
    score: number;
    checkTime: string;
    status: string;
  };
  academicSystem: {
    score: number;
    recordTime: string;
    status: string;
  };
  isConsistent: boolean;
  inconsistencyFields: string[];
}

export interface MaterialGapData {
  month: string;
  totalApplications: number;
  completeApplications: number;
  missingApplications: number;
  gapAmount: number;
  missingTypes: {
    type: string;
    count: number;
  }[];
}

export interface ReviewReasonData {
  reason: string;
  count: number;
  percentage: number;
}

export interface UtilizationComparison {
  period: string;
  current: number;
  yearOnYear: number;
  monthOnMonth: number;
  target: number;
  improvementMeasure?: string;
  isImproved: boolean;
}

export interface ClassroomRank {
  id: string;
  building: string;
  roomNo: string;
  type: string;
  capacity: number;
  utilizationRate: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export interface StudentInfo {
  id: string;
  name: string;
  studentNo: string;
  college: string;
  major: string;
  grade: number;
  transcriptScore: number;
  applicationScore: number;
  applicationStatus: 'pending' | 'approved' | 'rejected' | 'materials_missing';
  reviewResult?: 'passed' | 'failed';
  applyDate: string;
  courseCode: string;
  materials: MaterialItem[];
  supervisorName?: string;
  supervisorQuota?: {
    used: number;
    total: number;
    available: number;
  };
  reviewComments?: string;
}

export interface MaterialItem {
  name: string;
  type: string;
  status: 'submitted' | 'missing' | 'verified';
  uploadTime?: string;
}

export interface AnomalyExplanation {
  dataPointId: string;
  period: string;
  anomalyValue: number;
  expectedValue: number;
  deviation: number;
  deviationPercent: number;
  supervisorQuotaImpact: {
    expectedQuota: number;
    actualQuota: number;
    impactDescription: string;
  };
  otherFactors: string[];
}

export interface FilterOptions {
  college?: string;
  major?: string;
  grade?: number;
  scoreRange?: [number, number];
  applicationStatus?: string[];
  materialStatus?: string[];
  dateRange?: [string, string];
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
