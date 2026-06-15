import { NextRequest, NextResponse } from 'next/server';
import {
  getMultiSourceData as mockGetMultiSourceData,
  getColleges as mockGetColleges,
} from '@/lib/mockData';
import type { MultiSourceData } from '@/types';

function resolveDataSourceMode(): 'mock' | 'prisma' {
  const mode = process.env.NEXT_PUBLIC_DATA_SOURCE || process.env.DATA_SOURCE;
  if (mode === 'prisma' && !!process.env.DATABASE_URL) {
    return 'prisma';
  }
  return 'mock';
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

async function prismaGetMultiSourceData(
  filters?: { showOnlyInconsistent?: boolean; college?: string }
): Promise<MultiSourceData[]> {
  const { prisma } = await import('@/lib/prisma');

  const dataVersions = await prisma.dataVersion.findMany({
    include: { dataSource: true },
    orderBy: { checkTime: 'desc' },
  });

  const applicationIds = Array.from(new Set(dataVersions.map(dv => dv.recordId)));

  const whereClause: any = { id: { in: applicationIds } };
  if (filters?.college) {
    whereClause.student = { college: filters.college };
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: { student: true },
  });
  const appMap = new Map(applications.map(a => [a.id, a]));

  const grouped: Record<string, any> = {};
  for (const dv of dataVersions) {
    const key = dv.recordId;
    if (!grouped[key]) {
      grouped[key] = { application: appMap.get(key), versions: [] };
    }
    grouped[key].versions.push(dv);
  }

  const result: MultiSourceData[] = [];
  for (const key of Object.keys(grouped)) {
    const item = grouped[key];
    const app = item.application as any;
    const versions = item.versions as any[];

    if (filters?.college && app?.student?.college !== filters.college) continue;

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
        applyTime: app?.applyTime ? new Date(app.applyTime).toISOString().split('T')[0] : '-',
        status: mapApplicationStatus(app?.status),
      },
      campusCard: {
        score: campusScore,
        checkTime: campusVersion?.checkTime
          ? new Date(campusVersion.checkTime).toISOString().split('T')[0]
          : '-',
        status: campusVersion ? '已核验' : '-',
      },
      academicSystem: {
        score: academicScore,
        recordTime: academicVersion?.checkTime
          ? new Date(academicVersion.checkTime).toISOString().split('T')[0]
          : '-',
        status: academicVersion ? '有效' : '-',
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

  return result;
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
  } catch {
    return mockGetColleges();
  }
}

export async function GET(request: NextRequest) {
  const mode = resolveDataSourceMode();
  const { searchParams } = request.nextUrl;
  const showOnlyInconsistent = searchParams.get('inconsistent') === 'true';
  const college = searchParams.get('college') || undefined;

  const filters = { showOnlyInconsistent, college };

  let multiSourceData: MultiSourceData[];
  let colleges: string[];

  if (mode === 'prisma') {
    try {
      [multiSourceData, colleges] = await Promise.all([
        prismaGetMultiSourceData(filters),
        prismaGetColleges(),
      ]);
    } catch (e) {
      console.warn('[API /multi-source] Prisma 查询失败，回退到 Mock:', e);
      let data = mockGetMultiSourceData();
      if (showOnlyInconsistent) data = data.filter(d => !d.isConsistent);
      multiSourceData = data;
      colleges = mockGetColleges();
    }
  } else {
    let data = mockGetMultiSourceData();
    if (showOnlyInconsistent) data = data.filter(d => !d.isConsistent);
    if (college) {
      const collegeMap: Record<string, string[]> = {
        '计算机学院': ['CS101', 'CS201', 'CS301'],
        '数学学院': ['MATH101', 'MATH201'],
        '物理学院': ['PHY101'],
        '外语学院': ['ENG101'],
        '经济学院': ['ECON101'],
      };
      const codes = collegeMap[college] || [];
      data = data.filter(d => codes.includes(d.courseCode));
    }
    multiSourceData = data;
    colleges = mockGetColleges();
  }

  return NextResponse.json({
    mode,
    multiSourceData,
    colleges,
  });
}
