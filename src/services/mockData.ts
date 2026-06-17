import type {
  SettlementTrend,
  SettlementSummary,
  AssessmentScale,
  TrainingPrescription,
  TreatmentCalendarDay,
  TreatmentSession,
  EquipmentRecord,
  RejectionRecord,
  SavedView,
} from '@/types'

const PATIENT_NAMES = [
  '张建国', '李美华', '王志远', '刘秀英', '陈明辉',
  '赵雅琴', '孙大伟', '周丽芳',
]

const PATIENT_IDS = [
  'P001', 'P002', 'P003', 'P004', 'P005',
  'P006', 'P007', 'P008',
]

const DEPARTMENTS = ['神经康复科', '骨科康复科', '心肺康复科']

const THERAPIST_NAMES = ['王晓峰', '刘静', '张伟', '陈丽华', '赵明']

const SCALE_NAMES = [
  'FIM量表', 'Barthel指数', 'Berg平衡量表',
  '徒手肌力评定', '关节活动度评定', '改良Ashworth量表',
  'Brunnstrom分期', '吞咽功能评定', '认知功能评定(MoCA)',
  '日常生活活动能力评定', '6分钟步行试验', '心肺运动试验',
]

const REJECTION_REASONS = [
  '超适应症治疗',
  '缺少评估记录',
  '治疗次数超标',
  '缺少医嘱支持',
  '重复收费项目',
  '治疗项目与诊断不符',
  '缺少治疗记录签名',
  '超医保目录范围',
  '缺少功能评定依据',
  '治疗计划未审批',
  '住院天数超限',
  '缺少康复治疗指征',
]

const EQUIPMENT_NAMES = [
  '下肢智能反馈训练系统', '上肢机器人训练系统',
  '平衡测试训练系统', '吞咽电刺激治疗仪',
  '经颅磁刺激仪', '生物反馈治疗仪',
  '气压循环治疗仪', '减重步态训练系统',
  '超声波治疗仪', '短波治疗仪',
]

const PRESCRIPTION_NAMES = [
  '神经促通技术训练', '关节活动度训练',
  '肌力增强训练', '平衡功能训练',
  '步态训练', '日常生活活动训练',
  '吞咽功能训练', '认知功能训练',
  '心肺耐力训练', '手功能训练',
  '核心稳定性训练', '牵伸训练',
]

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function generateSettlementTrend(): SettlementTrend[] {
  const data: SettlementTrend[] = []
  const year = new Date().getFullYear()

  for (let m = 0; m < 12; m++) {
    const totalAmount = rand(50000, 200000)
    const rejectionRate = rand(3, 12)
    const rejectedAmount = Math.round(totalAmount * rejectionRate / 100)
    const completionRate = rand(65, 92)

    data.push({
      period: `${year}-${pad(m + 1)}`,
      totalAmount: Math.round(totalAmount),
      rejectedAmount,
      rejectionRate,
      completionRate,
    })
  }

  return data
}

export function generateSettlementSummary(): SettlementSummary {
  const totalAmount = rand(80000, 180000)
  const rejectionRate = rand(4, 10)
  const rejectedAmount = Math.round(totalAmount * rejectionRate / 100)
  const completionRate = rand(70, 90)

  return {
    totalAmount: Math.round(totalAmount),
    rejectedAmount,
    rejectionRate,
    completionRate,
    totalAmountChange: rand(-5, 15),
    rejectedAmountChange: rand(-8, 5),
    rejectionRateChange: rand(-3, 2),
    completionRateChange: rand(-2, 8),
  }
}

export function generateAssessmentScales(): AssessmentScale[] {
  const records: AssessmentScale[] = []

  for (let i = 0; i < 18; i++) {
    const patientIdx = i % PATIENT_NAMES.length
    const patientId = PATIENT_IDS[patientIdx]
    const patientName = PATIENT_NAMES[patientIdx]
    const scaleName = SCALE_NAMES[i % SCALE_NAMES.length]
    const score = randInt(10, 120)
    const previousScore = randInt(10, 120)
    const hasLinkedPrescription = Math.random() > 0.3
    const month = randInt(1, 12)
    const day = randInt(1, 28)

    records.push({
      id: `AS${(i + 1).toString().padStart(3, '0')}`,
      patientId,
      patientName,
      scaleName,
      score,
      previousScore,
      assessedAt: `2026-${pad(month)}-${pad(day)}`,
      hasLinkedPrescription,
    })
  }

  return records
}

export function generateTrainingPrescriptions(): TrainingPrescription[] {
  const records: TrainingPrescription[] = []
  const statuses: TrainingPrescription['status'][] = ['active', 'completed', 'expired']

  for (let i = 0; i < 24; i++) {
    const patientIdx = i % PATIENT_NAMES.length
    const patientId = PATIENT_IDS[patientIdx]
    const totalSessions = randInt(10, 36)
    const completedSessions = randInt(0, totalSessions)
    const status = pick(statuses)
    const startMonth = randInt(1, 6)
    const endMonth = startMonth + randInt(1, 3)

    records.push({
      id: `TP${(i + 1).toString().padStart(3, '0')}`,
      patientId,
      assessmentId: `AS${((i % 18) + 1).toString().padStart(3, '0')}`,
      prescriptionName: PRESCRIPTION_NAMES[i % PRESCRIPTION_NAMES.length],
      totalSessions,
      completedSessions,
      completionRate: Math.round((completedSessions / totalSessions) * 10000) / 100,
      startDate: `2026-${pad(startMonth)}-01`,
      endDate: `2026-${pad(Math.min(endMonth, 12))}-28`,
      status,
    })
  }

  return records
}

export function generateTreatmentCalendar(): TreatmentCalendarDay[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendar: TreatmentCalendarDay[] = []

  const sessionStatuses: TreatmentSession['status'][] = [
    'completed', 'completed', 'completed', 'completed',
    'missed', 'rejected', 'scheduled',
  ]

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`
    const isWeekend = new Date(year, month, d).getDay() % 6 === 0
    const scheduledCount = isWeekend ? randInt(0, 3) : randInt(4, 10)
    const details: TreatmentSession[] = []
    let completedCount = 0
    let missedCount = 0
    let rejectedCount = 0

    for (let s = 0; s < scheduledCount; s++) {
      const status = d <= now.getDate() ? pick(sessionStatuses) : 'scheduled'
      if (status === 'completed') completedCount++
      else if (status === 'missed') missedCount++
      else if (status === 'rejected') rejectedCount++

      const hour = 8 + Math.floor(s * 2)
      details.push({
        id: `TS_${dateStr}_${s + 1}`,
        time: `${pad(hour)}:${s % 2 === 0 ? '00' : '30'}`,
        projectName: pick(PRESCRIPTION_NAMES),
        therapistName: pick(THERAPIST_NAMES),
        status,
        equipmentId: Math.random() > 0.5 ? `EQ${randInt(1, 10)}` : undefined,
      })
    }

    calendar.push({
      date: dateStr,
      scheduledCount,
      completedCount,
      missedCount,
      rejectedCount,
      details,
    })
  }

  return calendar
}

export function generateEquipmentRecords(): EquipmentRecord[] {
  const records: EquipmentRecord[] = []

  const parameterSets: Record<string, string[]> = {
    '下肢智能反馈训练系统': ['阻力等级', '步速', '训练时长', '负重比'],
    '上肢机器人训练系统': ['抓握力', '移动范围', '重复次数', '辅助力度'],
    '平衡测试训练系统': ['稳定指数', '偏移角度', '重心分布', '训练模式'],
    '吞咽电刺激治疗仪': ['电流强度', '频率', '脉宽', '通道'],
    '经颅磁刺激仪': ['刺激强度', '频率', '脉冲数', '线圈类型'],
    '生物反馈治疗仪': ['肌电阈值', '反馈模式', '训练时长', '灵敏度'],
    '气压循环治疗仪': ['压力值', '循环模式', '保持时间', '通道数'],
    '减重步态训练系统': ['减重比例', '步速', '坡度', '训练时长'],
    '超声波治疗仪': ['输出功率', '频率', '占空比', '治疗时间'],
    '短波治疗仪': ['输出功率', '治疗时间', '电极距离', '剂量'],
  }

  for (let i = 0; i < 12; i++) {
    const equipmentName = EQUIPMENT_NAMES[i % EQUIPMENT_NAMES.length]
    const paramNames = parameterSets[equipmentName] || ['参数1', '参数2']
    const parameters: Record<string, number | string> = {}

    for (const pName of paramNames) {
      if (pName.includes('模式') || pName.includes('类型') || pName.includes('通道')) {
        parameters[pName] = `${randInt(1, 5)}`
      } else {
        parameters[pName] = rand(1, 100)
      }
    }

    const month = randInt(1, 12)
    const day = randInt(1, 28)

    records.push({
      id: `ER${(i + 1).toString().padStart(3, '0')}`,
      sessionId: `TS_2026_${i + 1}`,
      equipmentName,
      parameters,
      recordedAt: `2026-${pad(month)}-${pad(day)}T${pad(randInt(8, 16))}:${pad(randInt(0, 59))}:00`,
      duration: randInt(15, 60),
    })
  }

  return records
}

export function generateRejectionRecords(): RejectionRecord[] {
  const records: RejectionRecord[] = []
  const remarkStatuses: RejectionRecord['remarkTask']['status'][] = ['pending', 'processing', 'resolved']
  const assignees = [...THERAPIST_NAMES, '李主任', '黄副主任']

  for (let i = 0; i < 15; i++) {
    const patientIdx = i % PATIENT_NAMES.length
    const rejectedAmount = rand(200, 8000)
    const hasRemark = Math.random() > 0.3
    const month = randInt(1, 12)
    const day = randInt(1, 28)
    const rejectionDate = `2026-${pad(month)}-${pad(day)}`

    let remarkTask: RejectionRecord['remarkTask'] | undefined

    if (hasRemark) {
      const status = pick(remarkStatuses)
      remarkTask = {
        id: `RT${(i + 1).toString().padStart(3, '0')}`,
        rejectionId: `RR${(i + 1).toString().padStart(3, '0')}`,
        assignee: pick(assignees),
        status,
        createdAt: rejectionDate,
        resolvedAt: status === 'resolved' ? `2026-${pad(month)}-${pad(Math.min(day + randInt(1, 5), 28))}` : undefined,
        conclusion: status === 'resolved' ? pick(['已补交评估记录', '已调整治疗方案', '已补充医嘱', '确认无误维持原判']) : undefined,
      }
    }

    records.push({
      id: `RR${(i + 1).toString().padStart(3, '0')}`,
      settlementId: `ST${randInt(1000, 9999)}`,
      patientId: PATIENT_IDS[patientIdx],
      patientName: PATIENT_NAMES[patientIdx],
      rejectedAmount: Math.round(rejectedAmount),
      rejectionReason: REJECTION_REASONS[i % REJECTION_REASONS.length],
      rejectionDate,
      remarkTask,
    })
  }

  return records
}

export function generateSavedViews(): SavedView[] {
  const now = new Date().toISOString().slice(0, 10)
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1

  return [
    {
      id: 'SV001',
      name: '本月训练完成率',
      owner: '王晓峰',
      isShared: true,
      filters: {
        dateRange: [`${year}-${pad(month)}-01`, now],
        completionRateRange: [0, 100],
      },
      createdAt: '2026-01-15',
    },
    {
      id: 'SV002',
      name: '我的拒付待办',
      owner: '刘静',
      isShared: false,
      filters: {
        dateRange: [`${year}-01-01`, now],
        rejectionStatus: 'pending',
      },
      createdAt: '2026-02-01',
    },
    {
      id: 'SV003',
      name: '神经康复科月报',
      owner: '张伟',
      isShared: true,
      filters: {
        dateRange: [`${year}-${pad(month)}-01`, now],
        department: '神经康复科',
      },
      createdAt: '2026-01-01',
    },
    {
      id: 'SV004',
      name: '早会统一口径',
      owner: '陈丽华',
      isShared: true,
      filters: {
        dateRange: [now, now],
        department: undefined,
        completionRateRange: [50, 100],
      },
      createdAt: '2026-03-10',
    },
    {
      id: 'SV005',
      name: '全院结算概览',
      owner: '赵明',
      isShared: true,
      filters: {
        dateRange: [`${year}-01-01`, now],
      },
      createdAt: '2026-01-01',
    },
  ]
}
