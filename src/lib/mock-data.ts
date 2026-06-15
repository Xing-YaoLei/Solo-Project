import type {
  TrendDataPoint,
  GradeComposition,
  MaterialDetail,
  CampusCardRecord,
  AdvisorAnomaly,
} from './types'

export const trendData: TrendDataPoint[] = [
  { semester: '2022-2023-1', count: 45, riskScore: 12 },
  { semester: '2022-2023-2', count: 52, riskScore: 15 },
  { semester: '2023-2024-1', count: 68, riskScore: 22 },
  { semester: '2023-2024-2', count: 73, riskScore: 28 },
  { semester: '2024-2025-1', count: 89, riskScore: 35 },
]

export const gradeComposition: GradeComposition[] = [
  { grade: 'A', count: 120, percentage: 24, fill: '#10B981' },
  { grade: 'B', count: 180, percentage: 36, fill: '#3B82F6' },
  { grade: 'C', count: 110, percentage: 22, fill: '#F59E0B' },
  { grade: 'D', count: 60, percentage: 12, fill: '#F97316' },
  { grade: 'F', count: 30, percentage: 6, fill: '#EF4444' },
]

export const materialDetails: MaterialDetail[] = [
  {
    id: '1',
    studentName: '张伟',
    studentId: '2022010001',
    materialType: '成绩单原件',
    submittedAt: '2025-01-15T09:30:00Z',
    status: '待审核',
    riskLevel: 'high',
  },
  {
    id: '2',
    studentName: '李娜',
    studentId: '2022010002',
    materialType: '身份证复印件',
    submittedAt: '2025-01-14T14:20:00Z',
    status: '审核中',
    riskLevel: 'medium',
  },
  {
    id: '3',
    studentName: '王强',
    studentId: '2022010003',
    materialType: '申请表',
    submittedAt: '2025-01-13T11:00:00Z',
    status: '已通过',
    riskLevel: 'low',
  },
  {
    id: '4',
    studentName: '赵敏',
    studentId: '2022010004',
    materialType: '成绩单原件',
    submittedAt: '2025-01-12T16:45:00Z',
    status: '已退回',
    riskLevel: 'high',
  },
  {
    id: '5',
    studentName: '陈思',
    studentId: '2022010005',
    materialType: '申请表',
    submittedAt: '2025-01-11T08:15:00Z',
    status: '审核中',
    riskLevel: 'medium',
  },
  {
    id: '6',
    studentName: '刘洋',
    studentId: '2022010006',
    materialType: '身份证复印件',
    submittedAt: '2025-01-10T10:30:00Z',
    status: '已通过',
    riskLevel: 'low',
  },
]

export const campusCardRecords: CampusCardRecord[] = [
  {
    id: '1',
    studentId: '2022010001',
    studentName: '张伟',
    location: '图书馆一楼大厅',
    timestamp: '2025-01-15T22:30:00Z',
    isAnomaly: true,
  },
  {
    id: '2',
    studentId: '2022010001',
    studentName: '张伟',
    location: '第三教学楼自习室',
    timestamp: '2025-01-15T23:15:00Z',
    isAnomaly: true,
  },
  {
    id: '3',
    studentId: '2022010002',
    studentName: '李娜',
    location: '学生食堂二楼',
    timestamp: '2025-01-14T12:00:00Z',
    isAnomaly: false,
  },
  {
    id: '4',
    studentId: '2022010003',
    studentName: '王强',
    location: '体育馆入口',
    timestamp: '2025-01-14T18:30:00Z',
    isAnomaly: false,
  },
  {
    id: '5',
    studentId: '2022010004',
    studentName: '赵敏',
    location: '行政楼打印室',
    timestamp: '2025-01-13T21:00:00Z',
    isAnomaly: true,
  },
]

export const advisorAnomalies: AdvisorAnomaly[] = [
  {
    advisorId: 'T001',
    advisorName: '孙明辉',
    department: '计算机科学学院',
    totalReviews: 42,
    anomalyCount: 8,
    anomalyRate: 19.0,
    recentAnomalies: ['成绩修改未附说明', '批量修改同一课程成绩', '期末成绩分布异常'],
  },
  {
    advisorId: 'T002',
    advisorName: '周建国',
    department: '数学与统计学院',
    totalReviews: 35,
    anomalyCount: 5,
    anomalyRate: 14.3,
    recentAnomalies: ['补考成绩与原始成绩差距过大', '成绩录入时间异常'],
  },
  {
    advisorId: 'T003',
    advisorName: '吴晓燕',
    department: '经济管理学院',
    totalReviews: 28,
    anomalyCount: 3,
    anomalyRate: 10.7,
    recentAnomalies: ['同一学生多门课程成绩同时变更'],
  },
  {
    advisorId: 'T004',
    advisorName: '郑伟',
    department: '外国语学院',
    totalReviews: 31,
    anomalyCount: 2,
    anomalyRate: 6.5,
    recentAnomalies: ['成绩修改频率偏高'],
  },
]
