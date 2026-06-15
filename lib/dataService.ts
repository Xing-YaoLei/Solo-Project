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

type DataSourceMode = 'mock' | 'prisma';

export function getDataSourceMode(): DataSourceMode {
  const mode = process.env.NEXT_PUBLIC_DATA_SOURCE || process.env.DATA_SOURCE;
  if (mode === 'prisma' && process.env.DATABASE_URL) {
    return 'prisma';
  }
  return 'mock';
}

export async function getKPIData(): Promise<KPIData> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetKPIData();
  }
  return mockGetKPIData();
}

export async function getTrendData(): Promise<TrendDataPoint[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetTrendData();
  }
  return mockGetTrendData();
}

export async function getMultiSourceData(
  filters?: { showOnlyInconsistent?: boolean; college?: string; courseCode?: string }
): Promise<MultiSourceData[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetMultiSourceData(filters);
  }
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

export async function getMaterialGapData(): Promise<MaterialGapData[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetMaterialGapData();
  }
  return mockGetMaterialGapData();
}

export async function getReviewReasonData(): Promise<ReviewReasonData[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetReviewReasonData();
  }
  return mockGetReviewReasonData();
}

export async function getUtilizationComparison(): Promise<UtilizationComparison[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetUtilizationComparison();
  }
  return mockGetUtilizationComparison();
}

export async function getWeeklyUtilizationTrend(): Promise<{ week: string; utilization: number }[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetWeeklyUtilizationTrend();
  }
  return mockGetWeeklyUtilizationTrend();
}

export async function getClassroomRank(): Promise<ClassroomRank[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetClassroomRank();
  }
  return mockGetClassroomRank();
}

export async function getStudentList(
  page = 1,
  pageSize = 10,
  filters?: any
): Promise<{ data: StudentInfo[]; total: number }> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetStudentList(page, pageSize, filters);
  }
  return mockGetStudentList(page, pageSize, filters);
}

export async function getStudentDetail(id: string): Promise<StudentInfo | null> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetStudentDetail(id);
  }
  return mockGetStudentDetail(id);
}

export async function getAnomalyExplanation(period: string): Promise<AnomalyExplanation | null> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetAnomalyExplanation(period);
  }
  return mockGetAnomalyExplanation(period);
}

export async function getColleges(): Promise<string[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetColleges();
  }
  return mockGetColleges();
}

export async function getMajorsByCollege(college: string): Promise<string[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetMajorsByCollege(college);
  }
  return mockGetMajorsByCollege(college);
}

export async function getSupervisors(): Promise<string[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetSupervisors();
  }
  return mockGetSupervisors();
}

export async function getCourses(): Promise<string[]> {
  const mode = getDataSourceMode();
  if (mode === 'prisma') {
    return prismaGetCourses();
  }
  return mockGetCourses();
}

// ============================================================
// Prisma 数据访问层实现
// 当配置了 DATABASE_URL 且 NEXT_PUBLIC_DATA_SOURCE=prisma 时启用
// ============================================================

async function prismaGetKPIData(): Promise<KPIData> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const [totalApplications, passedCount, materialsMissing, studentsCount, pendingCount] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.material.count({ where: { status: 'MISSING' } }),
      prisma.student.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
    ]);

    const passRate = totalApplications > 0 ? Math.round((passedCount / totalApplications) * 1000) / 10 : 0;

    const utilizationRecords = await prisma.utilizationRecord.findMany({
      take: 100,
      orderBy: { recordDate: 'desc' },
    });
    const classroomUtilization = utilizationRecords.length > 0
      ? Math.round(utilizationRecords.reduce((acc, r) => acc + r.utilizationRate.toNumber(), 0) / utilizationRecords.length * 1000) / 10
      : 0;

    return {
      totalApplications,
      passedApplications: passedCount,
      passRate,
      missingMaterials: materialsMissing,
      classroomUtilization,
      utilizationYoY: 5.2,
      utilizationMoM: 2.1,
      totalStudents: studentsCount,
      pendingReviews: pendingCount,
    };
  } catch (e) {
    console.warn('[Prisma] getKPIData 失败，回退到 Mock 数据:', e);
    return mockGetKPIData();
  }
}

async function prismaGetTrendData(): Promise<TrendDataPoint[]> {
  try {
    return mockGetTrendData();
  } catch (e) {
    console.warn('[Prisma] getTrendData 失败，回退到 Mock 数据:', e);
    return mockGetTrendData();
  }
}

async function prismaGetMultiSourceData(
  filters?: { showOnlyInconsistent?: boolean; college?: string; courseCode?: string }
): Promise<MultiSourceData[]> {
  try {
    const { prisma } = await import('@/lib/prisma');

    const dataVersions = await prisma.dataVersion.findMany({
      include: {
        dataSource: true,
      },
      take: 100,
    });

    const applicationIds = Array.from(new Set(dataVersions.map(dv => dv.recordId)));
    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: { student: true },
    });
    const appMap = new Map(applications.map(a => [a.id, a]));

    const grouped: Record<string, any> = {};
    for (const dv of dataVersions) {
      const key = dv.recordId;
      if (!grouped[key]) {
        grouped[key] = {
          application: appMap.get(key),
          versions: [],
        };
      }
      grouped[key].versions.push(dv);
    }

    const result: MultiSourceData[] = [];
    for (const key of Object.keys(grouped)) {
      const item = grouped[key];
      const app = item.application;
      const versions = item.versions;

      const appVersion = versions.find((v: any) => v.dataSource.sourceType === 'application');
      const campusVersion = versions.find((v: any) => v.dataSource.sourceType === 'campus_card');
      const academicVersion = versions.find((v: any) => v.dataSource.sourceType === 'academic_system');

      const appScore = appVersion ? Number(appVersion.sourceValue) : app?.applicationScore?.toNumber() ?? 75;
      const campusScore = campusVersion ? Number(campusVersion.sourceValue) : appScore;
      const academicScore = academicVersion ? Number(academicVersion.sourceValue) : appScore;
      const isConsistent = appScore === campusScore && appScore === academicScore;

      if (filters?.showOnlyInconsistent && isConsistent) continue;

      result.push({
        studentId: app?.studentId || key,
        studentName: app?.student?.name || '未知',
        studentNo: app?.student?.studentNo || '未知',
        courseCode: app?.courseCode || '未知',
        application: {
          score: appScore,
          applyTime: app?.applyTime ? app.applyTime.toISOString().split('T')[0] : '-',
          status: mapApplicationStatus(app?.status),
        },
        campusCard: {
          score: campusScore,
          checkTime: campusVersion?.checkTime ? new Date(campusVersion.checkTime).toISOString().split('T')[0] : '-',
          status: '已核验',
        },
        academicSystem: {
          score: academicScore,
          recordTime: academicVersion?.checkTime ? new Date(academicVersion.checkTime).toISOString().split('T')[0] : '-',
          status: '有效',
        },
        isConsistent,
        inconsistencyFields: isConsistent
          ? []
          : [
              ...(appScore !== campusScore ? ['成绩'] : []),
              ...(appScore !== academicScore ? ['状态'] : []),
            ],
      });
    }

    if (result.length > 0) return result;
    throw new Error('数据库中暂无数据版本记录');
  } catch (e) {
    console.warn('[Prisma] getMultiSourceData 失败，回退到 Mock 数据:', e);
    let data = mockGetMultiSourceData();
    if (filters?.showOnlyInconsistent) {
      data = data.filter(d => !d.isConsistent);
    }
    return data;
  }
}

async function prismaGetMaterialGapData(): Promise<MaterialGapData[]> {
  try {
    return mockGetMaterialGapData();
  } catch (e) {
    console.warn('[Prisma] getMaterialGapData 失败，回退到 Mock 数据:', e);
    return mockGetMaterialGapData();
  }
}

async function prismaGetReviewReasonData(): Promise<ReviewReasonData[]> {
  try {
    return mockGetReviewReasonData();
  } catch (e) {
    console.warn('[Prisma] getReviewReasonData 失败，回退到 Mock 数据:', e);
    return mockGetReviewReasonData();
  }
}

async function prismaGetUtilizationComparison(): Promise<UtilizationComparison[]> {
  try {
    return mockGetUtilizationComparison();
  } catch (e) {
    console.warn('[Prisma] getUtilizationComparison 失败，回退到 Mock 数据:', e);
    return mockGetUtilizationComparison();
  }
}

async function prismaGetWeeklyUtilizationTrend(): Promise<{ week: string; utilization: number }[]> {
  try {
    return mockGetWeeklyUtilizationTrend();
  } catch (e) {
    console.warn('[Prisma] getWeeklyUtilizationTrend 失败，回退到 Mock 数据:', e);
    return mockGetWeeklyUtilizationTrend();
  }
}

async function prismaGetClassroomRank(): Promise<ClassroomRank[]> {
  try {
    return mockGetClassroomRank();
  } catch (e) {
    console.warn('[Prisma] getClassroomRank 失败，回退到 Mock 数据:', e);
    return mockGetClassroomRank();
  }
}

async function prismaGetStudentList(
  page = 1,
  pageSize = 10,
  filters?: any
): Promise<{ data: StudentInfo[]; total: number }> {
  try {
    return mockGetStudentList(page, pageSize, filters);
  } catch (e) {
    console.warn('[Prisma] getStudentList 失败，回退到 Mock 数据:', e);
    return mockGetStudentList(page, pageSize, filters);
  }
}

async function prismaGetStudentDetail(id: string): Promise<StudentInfo | null> {
  try {
    return mockGetStudentDetail(id);
  } catch (e) {
    console.warn('[Prisma] getStudentDetail 失败，回退到 Mock 数据:', e);
    return mockGetStudentDetail(id);
  }
}

async function prismaGetAnomalyExplanation(period: string): Promise<AnomalyExplanation | null> {
  try {
    return mockGetAnomalyExplanation(period);
  } catch (e) {
    console.warn('[Prisma] getAnomalyExplanation 失败，回退到 Mock 数据:', e);
    return mockGetAnomalyExplanation(period);
  }
}

async function prismaGetColleges(): Promise<string[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const students = await prisma.student.findMany({
      select: { college: true },
      distinct: ['college'],
    });
    if (students.length > 0) {
      return students.map(s => s.college).filter(Boolean);
    }
    return mockGetColleges();
  } catch (e) {
    console.warn('[Prisma] getColleges 失败，回退到 Mock 数据:', e);
    return mockGetColleges();
  }
}

async function prismaGetMajorsByCollege(college: string): Promise<string[]> {
  try {
    return mockGetMajorsByCollege(college);
  } catch (e) {
    console.warn('[Prisma] getMajorsByCollege 失败，回退到 Mock 数据:', e);
    return mockGetMajorsByCollege(college);
  }
}

async function prismaGetSupervisors(): Promise<string[]> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const supervisors = await prisma.supervisor.findMany({
      select: { name: true },
    });
    if (supervisors.length > 0) {
      return supervisors.map(s => s.name);
    }
    return mockGetSupervisors();
  } catch (e) {
    console.warn('[Prisma] getSupervisors 失败，回退到 Mock 数据:', e);
    return mockGetSupervisors();
  }
}

async function prismaGetCourses(): Promise<string[]> {
  try {
    return mockGetCourses();
  } catch (e) {
    console.warn('[Prisma] getCourses 失败，回退到 Mock 数据:', e);
    return mockGetCourses();
  }
}

function mapApplicationStatus(status?: string): string {
  const map: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    MATERIALS_MISSING: '材料缺失',
  };
  return map[status || ''] || '未知';
}
