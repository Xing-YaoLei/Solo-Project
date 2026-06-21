import type {
  Hearing,
  Case,
  Conflict,
  Satisfaction,
  Reminder,
  DataVersion,
  CapacityRule,
  FunnelDataPoint,
  KpiData,
} from '@/types';

const now = new Date('2024-06-20T12:00:00Z');
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const random = seededRandom(42);

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + random() * (end.getTime() - start.getTime())
  );
}

export const mockCases: Case[] = [
  {
    id: 'case-1',
    caseNumber: '民一字第20240001号',
    caseName: '张三诉李四合同纠纷案',
    caseType: '民事',
    clientId: 'client-1',
    clientName: '张三',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'case-2',
    caseNumber: '刑初字第20240002号',
    caseName: '王五盗窃案',
    caseType: '刑事',
    clientId: 'client-2',
    clientName: '王五',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: 'case-3',
    caseNumber: '行政字第20240003号',
    caseName: '赵六诉工商局行政复议案',
    caseType: '行政',
    clientId: 'client-3',
    clientName: '赵六',
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'case-4',
    caseNumber: '民二字第20240004号',
    caseName: '某公司诉某企业货款纠纷案',
    caseType: '商事',
    clientId: 'client-4',
    clientName: '某科技有限公司',
    createdAt: new Date('2024-03-25'),
  },
  {
    id: 'case-5',
    caseNumber: '劳仲字第20240005号',
    caseName: '孙七劳动争议案',
    caseType: '劳动',
    clientId: 'client-5',
    clientName: '孙七',
    createdAt: new Date('2024-04-01'),
  },
  {
    id: 'case-6',
    caseNumber: '婚字第20240006号',
    caseName: '周八离婚纠纷案',
    caseType: '婚姻家庭',
    clientId: 'client-6',
    clientName: '周八',
    createdAt: new Date('2024-04-15'),
  },
  {
    id: 'case-7',
    caseNumber: '知产字第20240007号',
    caseName: '某软件公司著作权侵权案',
    caseType: '知识产权',
    clientId: 'client-7',
    clientName: '某软件股份有限公司',
    createdAt: new Date('2024-05-01'),
  },
  {
    id: 'case-8',
    caseNumber: '商字第20240008号',
    caseName: '吴九股权转让纠纷案',
    caseType: '商事',
    clientId: 'client-8',
    clientName: '吴九',
    createdAt: new Date('2024-05-15'),
  },
];

const courts = ['北京市朝阳区人民法院', '北京市海淀区人民法院', '北京市西城区人民法院', '北京市东城区人民法院'];
const judges = ['李明法官', '王芳法官', '张伟法官', '刘洋法官'];
const attendanceStatuses: Array<'ATTENDED' | 'ABSENT' | 'POSTPONED' | 'CANCELLED'> = ['ATTENDED', 'ATTENDED', 'ATTENDED', 'ATTENDED', 'ABSENT', 'POSTPONED', 'CANCELLED'];

export const mockConflicts: Conflict[] = [
  {
    id: 'conflict-1',
    caseId: 'case-1',
    hearingId: 'hearing-1',
    conflictType: '利益冲突',
    description: '代理律师同时为本案原告和另一关联案件被告提供服务',
    status: 'PENDING',
    dataGapStart: new Date('2024-06-01'),
    dataGapEnd: new Date('2024-06-10'),
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'conflict-2',
    caseId: 'case-3',
    hearingId: 'hearing-3',
    conflictType: '时间冲突',
    description: '同一律师在同一时间段有两个开庭安排',
    status: 'RESOLVED',
    dataGapStart: new Date('2024-06-05'),
    dataGapEnd: new Date('2024-06-08'),
    resolvedAt: new Date('2024-06-09'),
    createdAt: new Date('2024-06-05'),
  },
  {
    id: 'conflict-3',
    caseId: 'case-5',
    conflictType: '证据冲突',
    description: '双方提交的证据存在重大矛盾',
    status: 'ESCALATED',
    createdAt: new Date('2024-06-10'),
  },
  {
    id: 'conflict-4',
    caseId: 'case-7',
    hearingId: 'hearing-7',
    conflictType: '管辖冲突',
    description: '两法院对本案均主张管辖权',
    status: 'PENDING',
    dataGapStart: new Date('2024-06-12'),
    dataGapEnd: new Date('2024-06-20'),
    createdAt: new Date('2024-06-12'),
  },
  {
    id: 'conflict-5',
    caseId: 'case-2',
    hearingId: 'hearing-2',
    conflictType: '当事人冲突',
    description: '被告同时为另一刑事案件的关键证人',
    status: 'RESOLVED',
    resolvedAt: new Date('2024-06-15'),
    createdAt: new Date('2024-06-08'),
  },
];

export const mockHearings: Hearing[] = Array.from({ length: 50 }, (_, i) => {
  const caseIndex = i % mockCases.length;
  const caseItem = mockCases[caseIndex];
  const hasConflict = random() < 0.15;
  const conflictIndex = Math.floor(random() * mockConflicts.length);
  const conflict = hasConflict ? mockConflicts[conflictIndex] : undefined;
  const hours = [8, 9, 10, 11, 14, 15, 16, 17];
  const hour = hours[Math.floor(random() * hours.length)];
  const minute = random() > 0.5 ? '00' : '30';

  return {
    id: `hearing-${i + 1}`,
    caseId: caseItem.id,
    hearingDate: randomDate(thirtyDaysAgo, now),
    hearingTime: `${hour.toString().padStart(2, '0')}:${minute}`,
    court: courts[Math.floor(random() * courts.length)],
    judge: judges[Math.floor(random() * judges.length)],
    attendanceStatus: attendanceStatuses[Math.floor(random() * attendanceStatuses.length)],
    caseSystemVersion: `v${Math.floor(random() * 3) + 1}.${Math.floor(random() * 10)}.${Math.floor(random() * 5)}`,
    calendarToolVersion: `v${Math.floor(random() * 3) + 1}.${Math.floor(random() * 10)}.${Math.floor(random() * 5)}`,
    emailAttachmentVersion: `v${Math.floor(random() * 3) + 1}.${Math.floor(random() * 10)}.${Math.floor(random() * 5)}`,
    hasConflict,
    conflictId: conflict?.id,
    conflict,
    capacityRule: random() < 0.1 ? 'RULE-001' : undefined,
    anomalyExplanation: random() < 0.1 ? '当日开庭数超过容量上限，经协调调整' : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    case: caseItem,
  };
});

export const mockSatisfactions: Satisfaction[] = [
  {
    id: 'sat-1',
    caseId: 'case-1',
    clientId: 'client-1',
    clientName: '张三',
    rating: 4,
    feedback: '律师专业水平高，沟通及时',
    surveyDate: new Date('2024-06-01'),
    improvementMeasures: '加强庭前准备工作',
    followUpRating: 5,
    followUpDate: new Date('2024-06-15'),
  },
  {
    id: 'sat-2',
    caseId: 'case-2',
    clientId: 'client-2',
    clientName: '王五',
    rating: 3,
    feedback: '开庭时间调整较频繁',
    surveyDate: new Date('2024-06-05'),
    improvementMeasures: '优化日历同步机制',
    followUpRating: 4,
    followUpDate: new Date('2024-06-18'),
  },
  {
    id: 'sat-3',
    caseId: 'case-3',
    clientId: 'client-3',
    clientName: '赵六',
    rating: 5,
    feedback: '案件处理效率高，结果满意',
    surveyDate: new Date('2024-06-10'),
  },
  {
    id: 'sat-4',
    caseId: 'case-4',
    clientId: 'client-4',
    clientName: '某科技有限公司',
    rating: 4,
    feedback: '整体服务良好，建议增加定期汇报',
    surveyDate: new Date('2024-06-12'),
    improvementMeasures: '建立周报制度',
    followUpRating: 5,
    followUpDate: new Date('2024-06-20'),
  },
  {
    id: 'sat-5',
    caseId: 'case-5',
    clientId: 'client-5',
    clientName: '孙七',
    rating: 2,
    feedback: '沟通不够及时，对案件进度不了解',
    surveyDate: new Date('2024-06-08'),
    improvementMeasures: '指定专人跟进，每周至少沟通一次',
    followUpRating: 4,
    followUpDate: new Date('2024-06-22'),
  },
  {
    id: 'sat-6',
    caseId: 'case-6',
    clientId: 'client-6',
    clientName: '周八',
    rating: 5,
    feedback: '律师非常专业且有耐心',
    surveyDate: new Date('2024-06-15'),
  },
  {
    id: 'sat-7',
    caseId: 'case-7',
    clientId: 'client-7',
    clientName: '某软件股份有限公司',
    rating: 4,
    feedback: '案件处理专业，希望加快进度',
    surveyDate: new Date('2024-06-18'),
    improvementMeasures: '优化流程，减少等待时间',
  },
  {
    id: 'sat-8',
    caseId: 'case-8',
    clientId: 'client-8',
    clientName: '吴九',
    rating: 3,
    feedback: '庭前准备不够充分',
    surveyDate: new Date('2024-06-20'),
    improvementMeasures: '加强庭前会议和模拟法庭',
  },
];

export const mockReminders: Reminder[] = mockHearings.map((hearing, i) => {
  const hasReminder = i < 40;
  if (!hasReminder) return null as unknown as Reminder;
  
  const reminderCount = Math.floor(random() * 3) + 1;
  const reminders: Reminder[] = [];
  
  for (let j = 0; j < reminderCount; j++) {
    reminders.push({
      id: `reminder-${i + 1}-${j + 1}`,
      hearingId: hearing.id,
      recipient: hearing.case?.clientName || '当事人',
      recipientType: 'CLIENT',
      reminderType: (['EMAIL', 'SMS', 'CALENDAR'] as const)[Math.floor(random() * 3)],
      sentAt: new Date(hearing.hearingDate.getTime() - (j + 1) * 24 * 60 * 60 * 1000),
      status: (['SENT', 'OPENED', 'FAILED'] as const)[Math.floor(random() * 3)],
    });
  }
  return reminders;
}).flat().filter(Boolean);

mockHearings.forEach((hearing) => {
  hearing.reminders = mockReminders.filter((r) => r.hearingId === hearing.id);
});

export const mockDataVersions: DataVersion[] = [
  {
    id: 'dv-1',
    source: 'CASE_SYSTEM',
    version: 'v2.1.0',
    snapshotData: { count: 50, timestamp: Date.now() },
    importDate: new Date('2024-06-20'),
    importedBy: 'admin',
  },
  {
    id: 'dv-2',
    source: 'CALENDAR_TOOL',
    version: 'v1.5.2',
    snapshotData: { count: 48, timestamp: Date.now() },
    importDate: new Date('2024-06-20'),
    importedBy: 'admin',
  },
  {
    id: 'dv-3',
    source: 'EMAIL_ATTACHMENT',
    version: 'v3.0.1',
    snapshotData: { count: 47, timestamp: Date.now() },
    importDate: new Date('2024-06-20'),
    importedBy: 'admin',
  },
];

export const mockCapacityRules: CapacityRule[] = [
  {
    id: 'RULE-001',
    name: '日常开庭容量规则',
    description: '每日最多安排8场开庭，每周最多35场',
    maxDailyHearings: 8,
    maxWeeklyHearings: 35,
    timeSlotStart: '08:00',
    timeSlotEnd: '18:00',
  },
  {
    id: 'RULE-002',
    name: '高峰期容量规则',
    description: '旺季每日最多安排10场开庭',
    maxDailyHearings: 10,
    maxWeeklyHearings: 45,
    timeSlotStart: '08:00',
    timeSlotEnd: '19:00',
  },
];

export function getFunnelData(): FunnelDataPoint[] {
  const total = mockHearings.length;
  const scheduled = total;
  const reminded = mockReminders.filter((r) => r.status !== 'FAILED').length;
  const attended = mockHearings.filter((h) => h.attendanceStatus === 'ATTENDED').length;
  const completed = mockHearings.filter(
    (h) => h.attendanceStatus === 'ATTENDED' || h.attendanceStatus === 'POSTPONED'
  ).length;
  const satisfied = mockSatisfactions.filter((s) => s.rating >= 4).length;

  return [
    { name: '案件登记', value: total, fill: '#1e3a5f' },
    { name: '开庭排期', value: scheduled, fill: '#2d4a6f' },
    { name: '提醒送达', value: reminded, fill: '#3d5a7f' },
    { name: '实际到场', value: attended, fill: '#0d9488' },
    { name: '庭审完成', value: completed, fill: '#4d6a8f' },
    { name: '客户满意', value: satisfied, fill: '#10b981' },
  ];
}

export function getFunnelDataByHearings(hearings: Hearing[]): FunnelDataPoint[] {
  const total = hearings.length;
  const scheduled = total;
  
  const uniqueHearingIds = new Set(hearings.map((h) => h.id));
  const filteredReminders = mockReminders.filter((r) => uniqueHearingIds.has(r.hearingId));
  const reminded = filteredReminders.filter((r) => r.status !== 'FAILED').length;
  
  const attended = hearings.filter((h) => h.attendanceStatus === 'ATTENDED').length;
  const completed = hearings.filter(
    (h) => h.attendanceStatus === 'ATTENDED' || h.attendanceStatus === 'POSTPONED'
  ).length;
  
  const caseIds = new Set(hearings.map((h) => h.caseId));
  const satisfied = mockSatisfactions.filter((s) => caseIds.has(s.caseId) && s.rating >= 4).length;

  return [
    { name: '案件登记', value: total, fill: '#1e3a5f' },
    { name: '开庭排期', value: scheduled, fill: '#2d4a6f' },
    { name: '提醒送达', value: Math.min(reminded, total), fill: '#3d5a7f' },
    { name: '实际到场', value: attended, fill: '#0d9488' },
    { name: '庭审完成', value: completed, fill: '#4d6a8f' },
    { name: '客户满意', value: Math.min(satisfied, completed), fill: '#10b981' },
  ];
}

export function getKpiData(): KpiData {
  return {
    totalHearings: 50,
    attendanceRate: 0.48,
    conflictRate: 0.08,
    avgSatisfaction: 3.8,
    pendingConflicts: 2,
    postponedCount: 10,
  };
}

export function getKpiDataByHearings(hearings: Hearing[]): KpiData {
  const totalHearings = hearings.length;
  const attended = hearings.filter((h) => h.attendanceStatus === 'ATTENDED').length;
  const attendanceRate = totalHearings > 0 ? attended / totalHearings : 0;
  
  const conflictCount = hearings.filter((h) => h.hasConflict).length;
  const conflictRate = totalHearings > 0 ? conflictCount / totalHearings : 0;
  
  const caseIds = new Set(hearings.map((h) => h.caseId));
  const relatedSatisfactions = mockSatisfactions.filter((s) => caseIds.has(s.caseId));
  const avgSatisfaction = relatedSatisfactions.length > 0
    ? relatedSatisfactions.reduce((sum, s) => sum + s.rating, 0) / relatedSatisfactions.length
    : 0;
  
  const pendingConflicts = hearings.filter((h) => h.hasConflict && h.conflict?.status === 'PENDING').length;
  const postponedCount = hearings.filter((h) => h.attendanceStatus === 'POSTPONED').length;

  return {
    totalHearings,
    attendanceRate,
    conflictRate,
    avgSatisfaction,
    pendingConflicts,
    postponedCount,
  };
}
