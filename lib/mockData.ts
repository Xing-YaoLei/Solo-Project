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

const colleges = ['计算机学院', '数学学院', '物理学院', '外语学院', '经济学院'];
const majors: Record<string, string[]> = {
  '计算机学院': ['计算机科学与技术', '软件工程', '人工智能'],
  '数学学院': ['数学与应用数学', '信息与计算科学'],
  '物理学院': ['物理学', '应用物理学'],
  '外语学院': ['英语', '日语'],
  '经济学院': ['经济学', '金融学'],
};
const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '冯二', '陈三', '楚四', '魏五', '蒋六', '沈七'];
const courses = ['CS101', 'CS201', 'MATH101', 'PHY101', 'ENG101', 'ECON101', 'CS301', 'MATH201'];
const materialTypes = ['成绩单', '申请表', '身份证明', '复核理由书'];
const supervisors = ['张教授', '李教授', '王教授', '刘教授'];

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const getKPIData = (): KPIData => {
  return {
    totalApplications: 2847,
    passedApplications: 1924,
    passRate: 67.6,
    missingMaterials: 312,
    classroomUtilization: 68.4,
    utilizationYoY: 5.2,
    utilizationMoM: 2.1,
    totalStudents: 1562,
    pendingReviews: 156,
  };
};

export const getTrendData = (): TrendDataPoint[] => {
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
                  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
  const baseApplications = [180, 220, 250, 210, 190, 280, 320, 290, 310, 270, 240, 187];

  return months.map((month, idx) => {
    const apps = baseApplications[idx];
    const passed = Math.floor(apps * (0.6 + Math.random() * 0.15));
    const missing = Math.floor(apps * (0.08 + Math.random() * 0.08));
    const isAnomaly = month === '2024-06' || month === '2024-09';
    const gapAmount = isAnomaly ? Math.floor(missing * 1.5) : missing;

    return {
      month,
      applications: apps,
      passed,
      missingMaterials: missing,
      gapAmount,
      isAnomaly,
      anomalyReason: isAnomaly ? (month === '2024-06' ? '期末考试季' : '导师名额不足') : undefined,
      supervisorQuotaImpact: isAnomaly ? {
        expected: month === '2024-06' ? 30 : 25,
        actual: month === '2024-06' ? 45 : 25,
      } : undefined,
    };
  });
};

export const getMultiSourceData = (): MultiSourceData[] => {
  const data: MultiSourceData[] = [];

  for (let i = 0; i < 20; i++) {
    const college = colleges[i % colleges.length];
    const majorList = majors[college];
    const baseScore = 75 + (i % 20);
    const campusScore = i % 5 === 0 ? baseScore + 5 : baseScore;
    const academicScore = i % 7 === 0 ? baseScore - 3 : baseScore;
    const isConsistent = baseScore === campusScore && baseScore === academicScore;

    data.push({
      studentId: `stu-${i + 1}`,
      studentName: names[i % names.length],
      studentNo: `2021${String(i + 1).padStart(6, '0')}`,
      courseCode: courses[i % courses.length],
      application: {
        score: baseScore,
        applyTime: formatDate(new Date(2024, 0 + (i % 12), 1 + (i % 28))),
        status: i % 4 === 0 ? '待审核' : i % 4 === 1 ? '已通过' : i % 4 === 2 ? '已拒绝' : '材料缺失',
      },
      campusCard: {
        score: campusScore,
        checkTime: formatDate(new Date(2024, 0 + (i % 12), 2 + (i % 28))),
        status: '已核验',
      },
      academicSystem: {
        score: academicScore,
        recordTime: formatDate(new Date(2024, 0 + (i % 12), 3 + (i % 28))),
        status: '有效',
      },
      isConsistent,
      inconsistencyFields: isConsistent ? [] : (
        baseScore !== campusScore ? ['成绩'] :
        baseScore !== academicScore ? ['状态'] : ['成绩', '状态']
      ),
    });
  }

  return data;
};

export const getMaterialGapData = (): MaterialGapData[] => {
  const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];

  return months.map((month, idx) => {
    const total = 200 + idx * 30;
    const missing = Math.floor(total * (0.1 + idx * 0.02));
    const complete = total - missing;

    return {
      month,
      totalApplications: total,
      completeApplications: complete,
      missingApplications: missing,
      gapAmount: missing,
      missingTypes: [
        { type: '成绩单', count: Math.floor(missing * 0.4) },
        { type: '申请表', count: Math.floor(missing * 0.25) },
        { type: '身份证明', count: Math.floor(missing * 0.2) },
        { type: '复核理由书', count: Math.ceil(missing * 0.15) },
      ],
    };
  });
};

export const getReviewReasonData = (): ReviewReasonData[] => {
  return [
    { reason: '成绩计算错误', count: 892, percentage: 31.3 },
    { reason: '评分标准争议', count: 654, percentage: 23.0 },
    { reason: '漏登成绩', count: 421, percentage: 14.8 },
    { reason: '平时分争议', count: 387, percentage: 13.6 },
    { reason: '考勤计分错误', count: 298, percentage: 10.5 },
    { reason: '其他原因', count: 195, percentage: 6.8 },
  ];
};

export const getUtilizationComparison = (): UtilizationComparison[] => {
  const semesters = ['2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1'];
  const baseRates = [55.2, 58.6, 62.3, 68.4];
  const measures = [undefined, undefined, '优化排课系统', '引入智慧教室'];

  return semesters.map((semester, idx) => ({
    period: semester,
    current: baseRates[idx],
    yearOnYear: idx > 1 ? baseRates[idx] - baseRates[idx - 2] : 0,
    monthOnMonth: idx > 0 ? baseRates[idx] - baseRates[idx - 1] : 0,
    target: 65,
    improvementMeasure: measures[idx],
    isImproved: idx > 0 && baseRates[idx] > baseRates[idx - 1],
  }));
};

export const getWeeklyUtilizationTrend = (): { week: string; utilization: number }[] => {
  const data: { week: string; utilization: number }[] = [];
  for (let w = 1; w <= 16; w++) {
    data.push({
      week: `第${w}周`,
      utilization: 60 + Math.sin(w * 0.5) * 8 + Math.random() * 5,
    });
  }
  return data;
};

export const getClassroomRank = (): ClassroomRank[] => {
  const classrooms = [
    { building: '教学楼A', roomNo: '101', type: '多媒体教室', capacity: 120 },
    { building: '教学楼A', roomNo: '102', type: '普通教室', capacity: 80 },
    { building: '教学楼A', roomNo: '201', type: '实验室', capacity: 60 },
    { building: '教学楼B', roomNo: '101', type: '阶梯教室', capacity: 150 },
    { building: '教学楼B', roomNo: '202', type: '多媒体教室', capacity: 100 },
    { building: '实验楼', roomNo: '301', type: '实验室', capacity: 40 },
    { building: '教学楼A', roomNo: '301', type: '普通教室', capacity: 90 },
    { building: '教学楼B', roomNo: '301', type: '多媒体教室', capacity: 110 },
  ];

  return classrooms.map((room, idx) => ({
    id: `classroom-${idx}`,
    ...room,
    utilizationRate: 45 + Math.random() * 45,
    rank: idx + 1,
    trend: ['up', 'down', 'stable'][idx % 3] as 'up' | 'down' | 'stable',
  })).sort((a, b) => b.utilizationRate - a.utilizationRate)
    .map((room, idx) => ({ ...room, rank: idx + 1 }));
};

export const getStudentList = (page = 1, pageSize = 10, filters?: any): { data: StudentInfo[]; total: number } => {
  const students: StudentInfo[] = [];

  for (let i = 0; i < 50; i++) {
    const college = colleges[i % colleges.length];
    const majorList = majors[college];
    const statuses: Array<'pending' | 'approved' | 'rejected' | 'materials_missing'> = ['pending', 'approved', 'rejected', 'materials_missing'];
    const status = statuses[i % 4];
    const transcriptScore = 60 + (i * 0.7) % 35;
    const applicationScore = 65 + (i * 0.5) % 30;

    const materials: any[] = materialTypes.map((type, idx) => ({
      name: type,
      type,
      status: idx < 3 ? 'submitted' : (i % 3 === 0 ? 'missing' : 'verified'),
      uploadTime: idx < 3 ? formatDate(new Date(2024, 8, 1 + i)) : undefined,
    }));

    students.push({
      id: `student-${i}`,
      name: names[i % names.length],
      studentNo: `2021${String(i + 1).padStart(6, '0')}`,
      college,
      major: majorList[i % majorList.length],
      grade: 2021 + (i % 3),
      transcriptScore: Math.round(transcriptScore * 10) / 10,
      applicationScore: Math.round(applicationScore * 10) / 10,
      applicationStatus: status,
      reviewResult: status === 'approved' ? 'passed' : status === 'rejected' ? 'failed' : undefined,
      applyDate: formatDate(new Date(2024, 8, 1 + i)),
      courseCode: courses[i % courses.length],
      materials,
      supervisorName: supervisors[i % supervisors.length],
      supervisorQuota: {
        used: 20 + (i % 10),
        total: 30,
        available: 10 - (i % 10),
      },
      reviewComments: status === 'approved' ? '复核通过，成绩确实有误' : status === 'rejected' ? '成绩无误，不予通过' : undefined,
    });
  }

  let filtered = students;
  if (filters) {
    if (filters.college) {
      filtered = filtered.filter(s => s.college === filters.college);
    }
    if (filters.status?.length > 0) {
      filtered = filtered.filter(s => filters.status.includes(s.applicationStatus));
    }
    if (filters.materialStatus?.length > 0) {
      filtered = filtered.filter(s =>
        s.materials.some(m => filters.materialStatus.includes(m.status))
      );
    }
    if (filters.scoreRange) {
      filtered = filtered.filter(s =>
        s.transcriptScore >= filters.scoreRange[0] &&
        s.transcriptScore <= filters.scoreRange[1]
      );
    }
  }

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: filtered.slice(start, end),
    total: filtered.length,
  };
};

export const getStudentDetail = (id: string): StudentInfo | null => {
  const { data } = getStudentList(1, 100);
  return data.find(s => s.id === id) || null;
};

export const getAnomalyExplanation = (period: string): AnomalyExplanation | null => {
  const explanations: Record<string, AnomalyExplanation> = {
    '2024-06': {
      dataPointId: 'anomaly-1',
      period: '2024-06',
      anomalyValue: 280,
      expectedValue: 210,
      deviation: 70,
      deviationPercent: 33.3,
      supervisorQuotaImpact: {
        expectedQuota: 30,
        actualQuota: 45,
        impactDescription: '6月为期末考试季，导师名额临时增加50%应对高峰',
      },
      otherFactors: ['期末成绩公布后复核需求集中爆发', '部分学院放宽复核条件', '新生课程首次参与复核'],
    },
    '2024-09': {
      dataPointId: 'anomaly-2',
      period: '2024-09',
      anomalyValue: 310,
      expectedValue: 260,
      deviation: 50,
      deviationPercent: 19.2,
      supervisorQuotaImpact: {
        expectedQuota: 25,
        actualQuota: 25,
        impactDescription: '导师名额已满，部分申请延迟处理',
      },
      otherFactors: ['新学期开学复查需求增加', '上学期补考成绩复核', '系统升级导致数据积压'],
    },
  };

  return explanations[period] || null;
};

export const getColleges = (): string[] => colleges;
export const getMajorsByCollege = (college: string): string[] => majors[college] || [];
export const getSupervisors = (): string[] => supervisors;
export const getCourses = (): string[] => courses;
