import type {
  KPIData,
  TrendDataPoint,
  MultiSourceData,
  MaterialGapData,
  ReviewReasonData,
  UtilizationComparison,
  ClassroomRank,
  StudentInfo,
  AnomalyExplanation,
} from '@/types';
import {
  getKPIData as mockGetKPIData,
  getTrendData as mockGetTrendData,
  getMultiSourceData as mockGetMultiSourceData,
  getMaterialGapData as mockGetMaterialGapData,
  getReviewReasonData as mockGetReviewReasonData,
  getUtilizationComparison as mockGetUtilizationComparison,
  getWeeklyUtilizationTrend as mockGetWeeklyUtilizationTrend,
  getClassroomRank as mockGetClassroomRank,
  getStudentList as mockGetStudentList,
  getStudentDetail as mockGetStudentDetail,
  getAnomalyExplanation as mockGetAnomalyExplanation,
  getColleges as mockGetColleges,
  getMajorsByCollege as mockGetMajorsByCollege,
  getSupervisors as mockGetSupervisors,
  getCourses as mockGetCourses,
} from '@/lib/mockData';

export function getKPIData(): KPIData {
  return mockGetKPIData();
}

export function getTrendData(): TrendDataPoint[] {
  return mockGetTrendData();
}

export function getMultiSourceData(filters?: {
  showOnlyInconsistent?: boolean;
  college?: string;
  courseCode?: string;
}): MultiSourceData[] {
  let data = mockGetMultiSourceData();
  if (filters?.showOnlyInconsistent) {
    data = data.filter(d => !d.isConsistent);
  }
  if (filters?.college) {
    const collegeMap: Record<string, string[]> = {
      '计算机学院': ['CS101', 'CS201', 'CS301'],
      '数学学院': ['MATH101', 'MATH201'],
      '物理学院': ['PHY101'],
      '外语学院': ['ENG101'],
      '经济学院': ['ECON101'],
    };
    const codes = collegeMap[filters.college] || [];
    data = data.filter(d => codes.includes(d.courseCode));
  }
  if (filters?.courseCode) {
    data = data.filter(d => d.courseCode === filters.courseCode);
  }
  return data;
}

export function getMaterialGapData(): MaterialGapData[] {
  return mockGetMaterialGapData();
}

export function getReviewReasonData(): ReviewReasonData[] {
  return mockGetReviewReasonData();
}

export function getUtilizationComparison(): UtilizationComparison[] {
  return mockGetUtilizationComparison();
}

export function getWeeklyUtilizationTrend(): { week: string; utilization: number }[] {
  return mockGetWeeklyUtilizationTrend();
}

export function getClassroomRank(): ClassroomRank[] {
  return mockGetClassroomRank();
}

export function getStudentList(
  page = 1,
  pageSize = 10,
  filters?: any
): { data: StudentInfo[]; total: number } {
  return mockGetStudentList(page, pageSize, filters);
}

export function getStudentDetail(id: string): StudentInfo | null {
  return mockGetStudentDetail(id);
}

export function getAnomalyExplanation(period: string): AnomalyExplanation | null {
  return mockGetAnomalyExplanation(period);
}

export function getColleges(): string[] {
  return mockGetColleges();
}

export function getMajorsByCollege(college: string): string[] {
  return mockGetMajorsByCollege(college);
}

export function getSupervisors(): string[] {
  return mockGetSupervisors();
}

export function getCourses(): string[] {
  return mockGetCourses();
}
