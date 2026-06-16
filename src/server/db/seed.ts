import type {
  User,
  CareLevel,
  Elder,
  Assessment,
  Medication,
  MedicationExecution,
  VisitRecord,
  Incident,
  IncidentParty,
  FlowAttachment,
  FlowRemark,
  FlowHandler
} from '../../shared/types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const now = new Date();

export const mockCareLevels: CareLevel[] = [
  {
    id: 'care-level-1',
    name: '自理级',
    scoreRange: { min: 0, max: 30 },
    description: '生活完全自理，无需他人协助',
    careItems: ['日常巡查', '健康监测', '文娱活动'],
    isActive: true
  },
  {
    id: 'care-level-2',
    name: '半自理级',
    scoreRange: { min: 31, max: 60 },
    description: '部分生活需要协助，能独立完成部分日常活动',
    careItems: ['协助穿衣', '协助洗漱', '定时巡房', '用药提醒'],
    isActive: true
  },
  {
    id: 'care-level-3',
    name: '介助级',
    scoreRange: { min: 61, max: 85 },
    description: '大部分日常生活需要他人协助',
    careItems: ['协助进食', '协助如厕', '协助沐浴', '康复训练', '24小时监护'],
    isActive: true
  },
  {
    id: 'care-level-4',
    name: '介护级',
    scoreRange: { min: 86, max: 100 },
    description: '完全无法自理，需要全天候专业护理',
    careItems: ['全护理', '鼻饲护理', '压疮护理', '生命体征监测', '专业康复'],
    isActive: true
  }
];

export const mockUsers: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@eldercare.com',
    name: '张管理',
    role: 'admin',
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30)
  },
  {
    id: 'user-supervisor-1',
    email: 'supervisor@eldercare.com',
    name: '李主管',
    role: 'supervisor',
    isActive: true,
    createdAt: daysAgo(150),
    updatedAt: daysAgo(20)
  },
  {
    id: 'user-nurse-1',
    email: 'nurse@eldercare.com',
    name: '王护士',
    role: 'nurse',
    isActive: true,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(10)
  },
  {
    id: 'user-doctor-1',
    email: 'doctor@eldercare.com',
    name: '陈医生',
    role: 'doctor',
    isActive: true,
    createdAt: daysAgo(100),
    updatedAt: daysAgo(5)
  },
  {
    id: 'user-family-1',
    email: 'family@eldercare.com',
    name: '刘家属',
    role: 'family',
    isActive: true,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(2)
  }
];

const mockElders: Elder[] = [
  {
    id: 'elder-1',
    name: '赵秀兰',
    gender: 'female',
    birthDate: new Date('1945-03-15'),
    idCard: '110101194503150011',
    roomNumber: 'A101',
    admissionDate: daysAgo(365),
    status: 'admitted',
    careLevelId: 'care-level-2',
    avatar: null,
    allergies: ['青霉素'],
    medicalHistory: ['高血压', '糖尿病'],
    emergencyContact: { name: '赵建国', phone: '13800138001', relation: '儿子' },
    createdAt: daysAgo(365),
    updatedAt: daysAgo(10)
  },
  {
    id: 'elder-2',
    name: '钱国华',
    gender: 'male',
    birthDate: new Date('1938-07-22'),
    idCard: '110101193807220022',
    roomNumber: 'A102',
    admissionDate: daysAgo(300),
    status: 'admitted',
    careLevelId: 'care-level-3',
    avatar: null,
    allergies: [],
    medicalHistory: ['冠心病', '脑梗死后遗症'],
    emergencyContact: { name: '钱小梅', phone: '13800138002', relation: '女儿' },
    createdAt: daysAgo(300),
    updatedAt: daysAgo(15)
  },
  {
    id: 'elder-3',
    name: '孙美玲',
    gender: 'female',
    birthDate: new Date('1952-11-08'),
    idCard: '110101195211080033',
    roomNumber: 'B201',
    admissionDate: daysAgo(200),
    status: 'admitted',
    careLevelId: 'care-level-1',
    avatar: null,
    allergies: ['海鲜'],
    medicalHistory: ['骨质疏松'],
    emergencyContact: { name: '孙伟', phone: '13800138003', relation: '儿子' },
    createdAt: daysAgo(200),
    updatedAt: daysAgo(5)
  },
  {
    id: 'elder-4',
    name: '周德顺',
    gender: 'male',
    birthDate: new Date('1935-05-30'),
    idCard: '110101193505300044',
    roomNumber: 'B202',
    admissionDate: daysAgo(500),
    status: 'admitted',
    careLevelId: 'care-level-4',
    avatar: null,
    allergies: ['磺胺类药物'],
    medicalHistory: ['阿尔茨海默病', '高血压', '糖尿病'],
    emergencyContact: { name: '周芳', phone: '13800138004', relation: '女儿' },
    createdAt: daysAgo(500),
    updatedAt: daysAgo(3)
  },
  {
    id: 'elder-5',
    name: '吴桂英',
    gender: 'female',
    birthDate: new Date('1948-09-12'),
    idCard: '110101194809120055',
    roomNumber: 'C301',
    admissionDate: daysAgo(150),
    status: 'admitted',
    careLevelId: 'care-level-2',
    avatar: null,
    allergies: [],
    medicalHistory: ['关节炎'],
    emergencyContact: { name: '吴强', phone: '13800138005', relation: '儿子' },
    createdAt: daysAgo(150),
    updatedAt: daysAgo(8)
  },
  {
    id: 'elder-6',
    name: '郑文博',
    gender: 'male',
    birthDate: new Date('1942-12-25'),
    idCard: '110101194212250066',
    roomNumber: 'C302',
    admissionDate: daysAgo(100),
    status: 'pending',
    careLevelId: null,
    avatar: null,
    allergies: [],
    medicalHistory: ['前列腺增生'],
    emergencyContact: { name: '郑明', phone: '13800138006', relation: '儿子' },
    createdAt: daysAgo(100),
    updatedAt: daysAgo(1)
  },
  {
    id: 'elder-7',
    name: '冯淑珍',
    gender: 'female',
    birthDate: new Date('1950-02-18'),
    idCard: '110101195002180077',
    roomNumber: 'A103',
    admissionDate: daysAgo(250),
    status: 'admitted',
    careLevelId: 'care-level-1',
    avatar: null,
    allergies: ['花粉'],
    medicalHistory: ['过敏性鼻炎'],
    emergencyContact: { name: '冯丽', phone: '13800138007', relation: '女儿' },
    createdAt: daysAgo(250),
    updatedAt: daysAgo(12)
  },
  {
    id: 'elder-8',
    name: '王建军',
    gender: 'male',
    birthDate: new Date('1940-06-05'),
    idCard: '110101194006050088',
    roomNumber: 'D401',
    admissionDate: daysAgo(400),
    status: 'discharged',
    careLevelId: 'care-level-3',
    avatar: null,
    allergies: [],
    medicalHistory: ['慢性支气管炎'],
    emergencyContact: { name: '王磊', phone: '13800138008', relation: '儿子' },
    createdAt: daysAgo(400),
    updatedAt: daysAgo(60)
  }
];

const mockAssessments: Assessment[] = [
  {
    id: 'assessment-1',
    elderId: 'elder-1',
    status: 'archived',
    adlScore: 25,
    cognitionScore: 10,
    emotionScore: 5,
    socialScore: 8,
    totalScore: 48,
    suggestedLevelId: 'care-level-2',
    finalLevelId: 'care-level-2',
    currentStep: 5,
    createdAt: daysAgo(350),
    updatedAt: daysAgo(340)
  },
  {
    id: 'assessment-2',
    elderId: 'elder-2',
    status: 'archived',
    adlScore: 45,
    cognitionScore: 15,
    emotionScore: 8,
    socialScore: 10,
    totalScore: 78,
    suggestedLevelId: 'care-level-3',
    finalLevelId: 'care-level-3',
    currentStep: 5,
    createdAt: daysAgo(290),
    updatedAt: daysAgo(280)
  },
  {
    id: 'assessment-3',
    elderId: 'elder-3',
    status: 'archived',
    adlScore: 10,
    cognitionScore: 5,
    emotionScore: 3,
    socialScore: 5,
    totalScore: 23,
    suggestedLevelId: 'care-level-1',
    finalLevelId: 'care-level-1',
    currentStep: 5,
    createdAt: daysAgo(190),
    updatedAt: daysAgo(180)
  },
  {
    id: 'assessment-4',
    elderId: 'elder-4',
    status: 'archived',
    adlScore: 60,
    cognitionScore: 20,
    emotionScore: 12,
    socialScore: 15,
    totalScore: 107,
    suggestedLevelId: 'care-level-4',
    finalLevelId: 'care-level-4',
    currentStep: 5,
    createdAt: daysAgo(490),
    updatedAt: daysAgo(480)
  },
  {
    id: 'assessment-5',
    elderId: 'elder-5',
    status: 'archived',
    adlScore: 20,
    cognitionScore: 12,
    emotionScore: 6,
    socialScore: 7,
    totalScore: 45,
    suggestedLevelId: 'care-level-2',
    finalLevelId: 'care-level-2',
    currentStep: 5,
    createdAt: daysAgo(140),
    updatedAt: daysAgo(130)
  },
  {
    id: 'assessment-6',
    elderId: 'elder-6',
    status: 'evaluating',
    adlScore: 15,
    cognitionScore: 8,
    emotionScore: 4,
    socialScore: 0,
    totalScore: 27,
    suggestedLevelId: 'care-level-1',
    finalLevelId: null,
    currentStep: 3,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(2)
  },
  {
    id: 'assessment-7',
    elderId: 'elder-7',
    status: 'archived',
    adlScore: 12,
    cognitionScore: 6,
    emotionScore: 2,
    socialScore: 4,
    totalScore: 24,
    suggestedLevelId: 'care-level-1',
    finalLevelId: 'care-level-1',
    currentStep: 5,
    createdAt: daysAgo(240),
    updatedAt: daysAgo(230)
  },
  {
    id: 'assessment-8',
    elderId: 'elder-4',
    status: 'collecting',
    adlScore: 55,
    cognitionScore: 18,
    emotionScore: 0,
    socialScore: 0,
    totalScore: 73,
    suggestedLevelId: null,
    finalLevelId: null,
    currentStep: 2,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1)
  }
];

const mockMedications: Medication[] = [
  {
    id: 'med-1',
    elderId: 'elder-1',
    name: '氨氯地平片',
    dosage: '5mg',
    frequency: '每日一次',
    route: '口服',
    startDate: daysAgo(300),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '早餐后服用',
    isActive: true
  },
  {
    id: 'med-2',
    elderId: 'elder-1',
    name: '二甲双胍片',
    dosage: '0.5g',
    frequency: '每日两次',
    route: '口服',
    startDate: daysAgo(280),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '餐后服用',
    isActive: true
  },
  {
    id: 'med-3',
    elderId: 'elder-2',
    name: '阿司匹林肠溶片',
    dosage: '100mg',
    frequency: '每日一次',
    route: '口服',
    startDate: daysAgo(250),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '晚餐后服用',
    isActive: true
  },
  {
    id: 'med-4',
    elderId: 'elder-2',
    name: '阿托伐他汀钙片',
    dosage: '20mg',
    frequency: '每晚一次',
    route: '口服',
    startDate: daysAgo(250),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '睡前服用',
    isActive: true
  },
  {
    id: 'med-5',
    elderId: 'elder-4',
    name: '多奈哌齐片',
    dosage: '5mg',
    frequency: '每日一次',
    route: '口服',
    startDate: daysAgo(400),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '睡前服用',
    isActive: true
  },
  {
    id: 'med-6',
    elderId: 'elder-4',
    name: '氨氯地平片',
    dosage: '5mg',
    frequency: '每日一次',
    route: '口服',
    startDate: daysAgo(450),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '早餐后服用',
    isActive: true
  },
  {
    id: 'med-7',
    elderId: 'elder-5',
    name: '氨基葡萄糖胶囊',
    dosage: '0.75g',
    frequency: '每日两次',
    route: '口服',
    startDate: daysAgo(100),
    endDate: null,
    prescribedBy: '陈医生',
    notes: '餐后服用',
    isActive: true
  },
  {
    id: 'med-8',
    elderId: 'elder-3',
    name: '碳酸钙D3片',
    dosage: '600mg',
    frequency: '每日一次',
    route: '口服',
    startDate: daysAgo(150),
    endDate: daysAgo(30),
    prescribedBy: '陈医生',
    notes: '已停用，改为饮食补钙',
    isActive: false
  }
];

const mockMedicationExecutions: MedicationExecution[] = [
  {
    id: 'med-exec-1',
    medicationId: 'med-1',
    executedAt: daysAgo(1),
    executedBy: '王护士',
    signature: null,
    isAbnormal: false,
    abnormalNote: null
  },
  {
    id: 'med-exec-2',
    medicationId: 'med-2',
    executedAt: daysAgo(1),
    executedBy: '王护士',
    signature: null,
    isAbnormal: false,
    abnormalNote: null
  },
  {
    id: 'med-exec-3',
    medicationId: 'med-3',
    executedAt: daysAgo(1),
    executedBy: '王护士',
    signature: null,
    isAbnormal: false,
    abnormalNote: null
  },
  {
    id: 'med-exec-4',
    medicationId: 'med-5',
    executedAt: daysAgo(2),
    executedBy: '王护士',
    signature: null,
    isAbnormal: true,
    abnormalNote: '老人拒绝服药，已通知家属'
  }
];

const mockVisitRecords: VisitRecord[] = [
  {
    id: 'visit-1',
    elderId: 'elder-1',
    visitorName: '赵建国',
    relation: '儿子',
    visitorPhone: '13800138001',
    visitTime: daysAgo(7),
    leaveTime: daysAgo(7),
    notes: '探望母亲，状态良好',
    recordedBy: '王护士'
  },
  {
    id: 'visit-2',
    elderId: 'elder-1',
    visitorName: '赵晓梅',
    relation: '孙女',
    visitorPhone: '13900139001',
    visitTime: daysAgo(3),
    leaveTime: daysAgo(3),
    notes: '周末探望',
    recordedBy: '王护士'
  },
  {
    id: 'visit-3',
    elderId: 'elder-2',
    visitorName: '钱小梅',
    relation: '女儿',
    visitorPhone: '13800138002',
    visitTime: daysAgo(10),
    leaveTime: daysAgo(10),
    notes: '常规探望',
    recordedBy: '王护士'
  },
  {
    id: 'visit-4',
    elderId: 'elder-4',
    visitorName: '周芳',
    relation: '女儿',
    visitorPhone: '13800138004',
    visitTime: daysAgo(2),
    leaveTime: daysAgo(2),
    notes: '送换洗衣物',
    recordedBy: '王护士'
  },
  {
    id: 'visit-5',
    elderId: 'elder-5',
    visitorName: '吴强',
    relation: '儿子',
    visitorPhone: '13800138005',
    visitTime: daysAgo(5),
    leaveTime: daysAgo(5),
    notes: '',
    recordedBy: '王护士'
  },
  {
    id: 'visit-6',
    elderId: 'elder-3',
    visitorName: '孙伟',
    relation: '儿子',
    visitorPhone: '13800138003',
    visitTime: daysAgo(14),
    leaveTime: daysAgo(14),
    notes: '探望并参加活动',
    recordedBy: '李主管'
  }
];

const mockIncidents: Incident[] = [
  {
    id: 'incident-1',
    elderId: 'elder-2',
    type: 'fall',
    status: 'closed',
    reportedAt: daysAgo(45),
    reportedBy: '王护士',
    location: '卫生间',
    description: '老人在卫生间起身时不慎滑倒，右侧臀部着地',
    closedAt: daysAgo(40),
    summary: '经检查未发现骨折，已安排康复训练，加强巡房频率',
    correctiveActions: ['卫生间加装防滑垫', '增加夜间巡房次数', '对护理人员进行防跌倒培训']
  },
  {
    id: 'incident-2',
    elderId: 'elder-4',
    type: 'fall',
    status: 'confirming',
    reportedAt: daysAgo(8),
    reportedBy: '王护士',
    location: '房间',
    description: '老人夜间试图自行下床时跌倒，被巡房护士及时发现',
    closedAt: null,
    summary: null,
    correctiveActions: []
  },
  {
    id: 'incident-3',
    elderId: 'elder-5',
    type: 'other',
    status: 'supplementing',
    reportedAt: daysAgo(3),
    reportedBy: '李主管',
    location: '餐厅',
    description: '用餐时与其他老人发生争执，未造成人身伤害',
    closedAt: null,
    summary: null,
    correctiveActions: []
  }
];

const mockIncidentParties: IncidentParty[] = [
  {
    id: 'party-1',
    incidentId: 'incident-1',
    roleType: 'elder',
    userId: null,
    personName: '钱国华',
    description: '当事人，滑倒时自行尝试起身',
    supplementAt: daysAgo(44),
    isResponsible: false,
    responsibilityType: null
  },
  {
    id: 'party-2',
    incidentId: 'incident-1',
    roleType: 'nurse',
    userId: 'user-nurse-1',
    personName: '王护士',
    description: '发现人，10分钟前刚巡房',
    supplementAt: daysAgo(44),
    isResponsible: true,
    responsibilityType: 'indirect'
  },
  {
    id: 'party-3',
    incidentId: 'incident-1',
    roleType: 'witness',
    userId: null,
    personName: '孙美玲',
    description: '隔壁房间老人，听到声响',
    supplementAt: daysAgo(43),
    isResponsible: false,
    responsibilityType: null
  },
  {
    id: 'party-4',
    incidentId: 'incident-2',
    roleType: 'elder',
    userId: null,
    personName: '周德顺',
    description: '当事人，试图去厕所未按呼叫铃',
    supplementAt: daysAgo(7),
    isResponsible: false,
    responsibilityType: null
  },
  {
    id: 'party-5',
    incidentId: 'incident-2',
    roleType: 'nurse',
    userId: 'user-nurse-1',
    personName: '王护士',
    description: '巡房发现老人跌倒，立即报告',
    supplementAt: daysAgo(7),
    isResponsible: false,
    responsibilityType: null
  },
  {
    id: 'party-6',
    incidentId: 'incident-3',
    roleType: 'elder',
    userId: null,
    personName: '吴桂英',
    description: '当事人之一',
    supplementAt: null,
    isResponsible: null,
    responsibilityType: null
  }
];

const mockFlowAttachments: FlowAttachment[] = [
  {
    id: 'attach-1',
    entityType: 'assessment',
    entityId: 'assessment-1',
    fileName: '评估表-赵秀兰.pdf',
    fileUrl: '/mock/attachments/assessment-1.pdf',
    fileSize: 245678,
    mimeType: 'application/pdf',
    uploadedBy: '李主管',
    uploadedAt: daysAgo(345)
  },
  {
    id: 'attach-2',
    entityType: 'incident',
    entityId: 'incident-1',
    fileName: '现场照片.jpg',
    fileUrl: '/mock/attachments/incident-1-photo.jpg',
    fileSize: 1234567,
    mimeType: 'image/jpeg',
    uploadedBy: '王护士',
    uploadedAt: daysAgo(45)
  },
  {
    id: 'attach-3',
    entityType: 'incident',
    entityId: 'incident-1',
    fileName: '医疗报告.pdf',
    fileUrl: '/mock/attachments/incident-1-medical.pdf',
    fileSize: 567890,
    mimeType: 'application/pdf',
    uploadedBy: '陈医生',
    uploadedAt: daysAgo(44)
  },
  {
    id: 'attach-4',
    entityType: 'elder',
    entityId: 'elder-1',
    fileName: '身份证复印件.jpg',
    fileUrl: '/mock/attachments/elder-1-id.jpg',
    fileSize: 345678,
    mimeType: 'image/jpeg',
    uploadedBy: '张管理',
    uploadedAt: daysAgo(365)
  }
];

const mockFlowRemarks: FlowRemark[] = [
  {
    id: 'remark-1',
    entityType: 'assessment',
    entityId: 'assessment-6',
    content: '已完成日常生活能力评估，等待认知评估',
    createdBy: '王护士',
    createdAt: daysAgo(10)
  },
  {
    id: 'remark-2',
    entityType: 'assessment',
    entityId: 'assessment-6',
    content: '认知评估进行中，老人配合度良好',
    createdBy: '李主管',
    createdAt: daysAgo(5)
  },
  {
    id: 'remark-3',
    entityType: 'incident',
    entityId: 'incident-2',
    content: '老人生命体征平稳，已通知家属',
    createdBy: '陈医生',
    createdAt: daysAgo(8)
  },
  {
    id: 'remark-4',
    entityType: 'incident',
    entityId: 'incident-2',
    content: '家属同意进行进一步观察，暂不需要住院',
    createdBy: '李主管',
    createdAt: daysAgo(7)
  },
  {
    id: 'remark-5',
    entityType: 'incident',
    entityId: 'incident-3',
    content: '正在补充双方当事人陈述',
    createdBy: '张管理',
    createdAt: daysAgo(2)
  }
];

const mockFlowHandlers: FlowHandler[] = [
  {
    id: 'handler-1',
    entityType: 'assessment',
    entityId: 'assessment-1',
    stepName: '信息采集',
    userId: 'user-nurse-1',
    userName: '王护士',
    handledAt: daysAgo(350),
    action: 'submit'
  },
  {
    id: 'handler-2',
    entityType: 'assessment',
    entityId: 'assessment-1',
    stepName: '等级评估',
    userId: 'user-supervisor-1',
    userName: '李主管',
    handledAt: daysAgo(348),
    action: 'approve'
  },
  {
    id: 'handler-3',
    entityType: 'assessment',
    entityId: 'assessment-1',
    stepName: '最终审批',
    userId: 'user-admin-1',
    userName: '张管理',
    handledAt: daysAgo(340),
    action: 'approve'
  },
  {
    id: 'handler-4',
    entityType: 'assessment',
    entityId: 'assessment-6',
    stepName: '信息采集',
    userId: 'user-nurse-1',
    userName: '王护士',
    handledAt: daysAgo(15),
    action: 'submit'
  },
  {
    id: 'handler-5',
    entityType: 'assessment',
    entityId: 'assessment-6',
    stepName: '等级评估',
    userId: 'user-supervisor-1',
    userName: '李主管',
    handledAt: null,
    action: ''
  },
  {
    id: 'handler-6',
    entityType: 'incident',
    entityId: 'incident-1',
    stepName: '事件上报',
    userId: 'user-nurse-1',
    userName: '王护士',
    handledAt: daysAgo(45),
    action: 'report'
  },
  {
    id: 'handler-7',
    entityType: 'incident',
    entityId: 'incident-1',
    stepName: '补充调查',
    userId: 'user-supervisor-1',
    userName: '李主管',
    handledAt: daysAgo(43),
    action: 'complete'
  },
  {
    id: 'handler-8',
    entityType: 'incident',
    entityId: 'incident-1',
    stepName: '确认结案',
    userId: 'user-admin-1',
    userName: '张管理',
    handledAt: daysAgo(40),
    action: 'close'
  },
  {
    id: 'handler-9',
    entityType: 'incident',
    entityId: 'incident-2',
    stepName: '事件上报',
    userId: 'user-nurse-1',
    userName: '王护士',
    handledAt: daysAgo(8),
    action: 'report'
  },
  {
    id: 'handler-10',
    entityType: 'incident',
    entityId: 'incident-2',
    stepName: '补充调查',
    userId: 'user-supervisor-1',
    userName: '李主管',
    handledAt: null,
    action: ''
  }
];

type DateLike = Date | string;
type MockTableConstraint = { id: string; createdAt?: DateLike; updatedAt?: DateLike };

export interface MockTable<T extends MockTableConstraint> {
  findMany(): Promise<T[]>;
  findFirst(where?: Partial<T>): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T> & { id?: string }): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

function createMockTable<T extends MockTableConstraint>(initialData: T[]): MockTable<T> {
  const data: T[] = [...initialData];

  return {
    async findMany(): Promise<T[]> {
      return [...data];
    },
    async findFirst(where?: Partial<T>): Promise<T | null> {
      if (!where) return data[0] ?? null;
      const entry = data.find((item) =>
        Object.entries(where).every(([key, value]) => item[key as keyof T] === value)
      );
      return entry ?? null;
    },
    async findById(id: string): Promise<T | null> {
      return data.find((item) => item.id === id) ?? null;
    },
    async create(input: Partial<T> & { id?: string }): Promise<T> {
      const timestamp = new Date();
      const record = {
        ...(input as unknown as Record<string, unknown>),
        id: input.id ?? uuid(),
        createdAt: (input as { createdAt?: DateLike }).createdAt ?? timestamp,
        updatedAt: (input as { updatedAt?: DateLike }).updatedAt ?? timestamp
      } as unknown as T;
      data.push(record);
      return record;
    },
    async update(id: string, updateData: Partial<T>): Promise<T | null> {
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) return null;
      const updated = {
        ...data[index],
        ...updateData,
        updatedAt: new Date()
      } as T;
      data[index] = updated;
      return updated;
    },
    async delete(id: string): Promise<boolean> {
      const index = data.findIndex((item) => item.id === id);
      if (index === -1) return false;
      data.splice(index, 1);
      return true;
    }
  };
}

export interface MockDb {
  users: MockTable<User>;
  careLevels: MockTable<CareLevel>;
  elders: MockTable<Elder>;
  assessments: MockTable<Assessment>;
  medications: MockTable<Medication>;
  medicationExecutions: MockTable<MedicationExecution>;
  visitRecords: MockTable<VisitRecord>;
  incidents: MockTable<Incident>;
  incidentParties: MockTable<IncidentParty>;
  flowAttachments: MockTable<FlowAttachment>;
  flowRemarks: MockTable<FlowRemark>;
  flowHandlers: MockTable<FlowHandler>;
  transaction<T>(fn: (tx: MockDb) => Promise<T>): Promise<T>;
}

export function createMockDb(): MockDb {
  const users = createMockTable<User>([...mockUsers]);
  const careLevels = createMockTable<CareLevel>([...mockCareLevels]);
  const elders = createMockTable<Elder>([...mockElders]);
  const assessments = createMockTable<Assessment>([...mockAssessments]);
  const medications = createMockTable<Medication>([...mockMedications]);
  const medicationExecutions = createMockTable<MedicationExecution>([...mockMedicationExecutions]);
  const visitRecords = createMockTable<VisitRecord>([...mockVisitRecords]);
  const incidents = createMockTable<Incident>([...mockIncidents]);
  const incidentParties = createMockTable<IncidentParty>([...mockIncidentParties]);
  const flowAttachments = createMockTable<FlowAttachment>([...mockFlowAttachments]);
  const flowRemarks = createMockTable<FlowRemark>([...mockFlowRemarks]);
  const flowHandlers = createMockTable<FlowHandler>([...mockFlowHandlers]);

  const db: MockDb = {
    users,
    careLevels,
    elders,
    assessments,
    medications,
    medicationExecutions,
    visitRecords,
    incidents,
    incidentParties,
    flowAttachments,
    flowRemarks,
    flowHandlers,
    async transaction<T>(fn: (tx: MockDb) => Promise<T>): Promise<T> {
      return fn(db);
    }
  };

  return db;
}

export {
  mockElders,
  mockAssessments,
  mockMedications,
  mockMedicationExecutions,
  mockVisitRecords,
  mockIncidents,
  mockIncidentParties,
  mockFlowAttachments,
  mockFlowRemarks,
  mockFlowHandlers
};
