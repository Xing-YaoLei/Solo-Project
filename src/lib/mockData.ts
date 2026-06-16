import type { TreatmentStage, AppointmentStatus, PaymentStatus, TaskPriority, TaskStatus } from '@prisma/client';

const stageNames: Record<TreatmentStage, string> = {
  CONSULTATION: '初诊咨询',
  DIAGNOSIS: '检查诊断',
  TREATMENT_PLANNING: '方案设计',
  BRACKET_PLACEMENT: '托槽佩戴',
  ACTIVE_TREATMENT: '正畸治疗中',
  RETENTION: '保持期',
  COMPLETED: '治疗完成',
};

const firstNames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高'];
const lastNames = ['明', '华', '芳', '伟', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '娟', '涛'];
const doctors = ['王医生', '李医生', '张医生', '刘医生', '陈医生'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export interface MockPatient {
  id: string;
  patientNo: string;
  name: string;
  gender: string;
  birthDate: string;
  phone: string;
  idCardNo: string;
  address: string;
  treatmentStage: TreatmentStage;
  isOrthoCase: boolean;
  firstVisitDate: string;
  orthoStartDate: string | null;
  doctor: string;
  missedCount: number;
  revisitRate: number;
  warningLevel: 'normal' | 'warning' | 'critical';
  lastAppointmentDate: string | null;
  totalAppointments: number;
  completedAppointments: number;
}

export interface MockAppointment {
  id: string;
  patientId: string;
  appointmentNo: string;
  appointmentDate: string;
  appointmentType: string;
  status: AppointmentStatus;
  doctor: string;
  department: string;
  missedReason: string | null;
}

export interface MockChargeRecord {
  id: string;
  patientId: string;
  chargeNo: string;
  chargeDate: string;
  amount: string;
  itemName: string;
  itemType: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
}

export interface MockImageAttachment {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  category: string;
  uploadDate: string;
  description: string | null;
}

export interface MockNoteTask {
  id: string;
  patientId: string;
  taskType: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  conclusion: string | null;
  triggerReason: string | null;
  triggerValue: number | null;
  thresholdValue: number | null;
  createdAt: string;
}

export interface MockFunnelStage {
  stage: TreatmentStage;
  stageName: string;
  patientCount: number;
  missedCount: number;
  revisitRate: number;
  conversionRate: number;
}

export function generateMockPatients(count: number = 50): MockPatient[] {
  const patients: MockPatient[] = [];
  const stages: TreatmentStage[] = [
    'CONSULTATION',
    'DIAGNOSIS',
    'TREATMENT_PLANNING',
    'BRACKET_PLACEMENT',
    'ACTIVE_TREATMENT',
    'RETENTION',
    'COMPLETED',
  ];

  for (let i = 0; i < count; i++) {
    const stage = randomChoice(stages);
    const missedCount = randomInt(0, 6);
    const totalAppointments = randomInt(3, 20);
    const completedAppointments = totalAppointments - missedCount;
    const revisitRate = totalAppointments > 0 ? ((totalAppointments - missedCount) / totalAppointments) * 100 : 100;

    let warningLevel: 'normal' | 'warning' | 'critical' = 'normal';
    if (revisitRate < 50) {
      warningLevel = 'critical';
    } else if (revisitRate < 70) {
      warningLevel = 'warning';
    }

    const firstVisitDate = randomDate(new Date('2024-01-01'), new Date('2025-06-01'));
    const lastAppointmentDate = randomDate(new Date('2025-01-01'), new Date('2025-06-15'));

    patients.push({
      id: `patient-${i + 1}`,
      patientNo: `ORTHO${String(202400001 + i).padStart(8, '0')}`,
      name: randomChoice(firstNames) + randomChoice(lastNames),
      gender: randomChoice(['男', '女']),
      birthDate: randomDate(new Date('1980-01-01'), new Date('2010-12-31')).toISOString(),
      phone: `1${randomInt(3, 9)}${String(randomInt(100000000, 999999999))}`,
      idCardNo: `33010${randomInt(1980, 2010)}${String(randomInt(101, 1231)).padStart(4, '0')}${String(randomInt(1000, 9999))}`,
      address: '杭州市西湖区某某街道',
      treatmentStage: stage,
      isOrthoCase: true,
      firstVisitDate: firstVisitDate.toISOString(),
      orthoStartDate: stage !== 'CONSULTATION' && stage !== 'DIAGNOSIS'
        ? randomDate(firstVisitDate, new Date('2025-03-01')).toISOString()
        : null,
      doctor: randomChoice(doctors),
      missedCount,
      revisitRate,
      warningLevel,
      lastAppointmentDate: lastAppointmentDate.toISOString(),
      totalAppointments,
      completedAppointments,
    });
  }

  return patients.sort((a, b) => {
    const levelOrder = { critical: 0, warning: 1, normal: 2 };
    return levelOrder[a.warningLevel] - levelOrder[b.warningLevel];
  });
}

export function generateMockAppointments(patients: MockPatient[]): MockAppointment[] {
  const appointments: MockAppointment[] = [];
  const appointmentTypes = ['初诊咨询', '复诊检查', '托槽调整', '取模', '拍片', '洁牙', '保持器检查'];

  let aptIndex = 1;
  for (const patient of patients) {
    const numAppointments = patient.totalAppointments;
    const missedIndices = new Set<number>();
    while (missedIndices.size < patient.missedCount) {
      missedIndices.add(randomInt(0, numAppointments - 1));
    }

    for (let i = 0; i < numAppointments; i++) {
      const isMissed = missedIndices.has(i);
      const date = randomDate(new Date('2024-06-01'), new Date('2025-06-15'));

      appointments.push({
        id: `appointment-${aptIndex}`,
        patientId: patient.id,
        appointmentNo: `APT${String(aptIndex).padStart(8, '0')}`,
        appointmentDate: date.toISOString(),
        appointmentType: randomChoice(appointmentTypes),
        status: isMissed ? 'MISSED' : i === numAppointments - 1 && !isMissed ? 'SCHEDULED' : 'COMPLETED',
        doctor: patient.doctor,
        department: '正畸科',
        missedReason: isMissed ? randomChoice(['临时有事', '忘记预约', '身体不适', '交通问题']) : null,
      });
      aptIndex++;
    }
  }

  return appointments.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
}

export function generateMockChargeRecords(patients: MockPatient[]): MockChargeRecord[] {
  const charges: MockChargeRecord[] = [];
  const chargeItems = [
    { name: '初诊挂号费', type: '挂号', amount: 50 },
    { name: '口腔检查费', type: '检查', amount: 200 },
    { name: '全景片', type: '影像', amount: 150 },
    { name: '头颅侧位片', type: '影像', amount: 180 },
    { name: '取模费', type: '治疗', amount: 500 },
    { name: '方案设计费', type: '治疗', amount: 1000 },
    { name: '金属托槽矫正', type: '正畸', amount: 15000 },
    { name: '陶瓷托槽矫正', type: '正畸', amount: 20000 },
    { name: '隐形矫正', type: '正畸', amount: 35000 },
    { name: '复诊费', type: '复诊', amount: 200 },
    { name: '保持器', type: '正畸', amount: 800 },
    { name: '洁牙', type: '牙周', amount: 300 },
  ];

  let chargeIndex = 1;
  for (const patient of patients) {
    const numCharges = randomInt(3, 8);
    for (let i = 0; i < numCharges; i++) {
      const item = randomChoice(chargeItems);
      const date = randomDate(new Date('2024-06-01'), new Date('2025-06-15'));
      const isPaid = Math.random() > 0.15;

      charges.push({
        id: `charge-${chargeIndex}`,
        patientId: patient.id,
        chargeNo: `CHG${String(chargeIndex).padStart(8, '0')}`,
        chargeDate: date.toISOString(),
        amount: item.amount.toFixed(2),
        itemName: item.name,
        itemType: item.type,
        paymentStatus: isPaid ? 'PAID' : randomChoice(['PENDING', 'PARTIAL']),
        paymentMethod: isPaid ? randomChoice(['微信', '支付宝', '银行卡', '现金']) : '-',
      });
      chargeIndex++;
    }
  }

  return charges.sort((a, b) => new Date(b.chargeDate).getTime() - new Date(a.chargeDate).getTime());
}

export function generateMockImageAttachments(patients: MockPatient[]): MockImageAttachment[] {
  const images: MockImageAttachment[] = [];
  const categories = ['口内照', '面像', 'X光片', '全景片', '头颅侧位', '模型扫描'];
  const imageUrls = [
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop',
  ];

  let imgIndex = 1;
  for (const patient of patients) {
    if (Math.random() > 0.3) {
      const numImages = randomInt(2, 8);
      for (let i = 0; i < numImages; i++) {
        const category = randomChoice(categories);
        const date = randomDate(new Date('2024-06-01'), new Date('2025-06-15'));

        images.push({
          id: `image-${imgIndex}`,
          patientId: patient.id,
          fileName: `${patient.patientNo}_${category}_${i + 1}.jpg`,
          fileType: 'image/jpeg',
          fileSize: randomInt(100000, 2000000),
          fileUrl: randomChoice(imageUrls),
          category,
          uploadDate: date.toISOString(),
          description: i === 0 ? '治疗前基线照片' : null,
        });
        imgIndex++;
      }
    }
  }

  return images.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
}

export function generateMockNoteTasks(patients: MockPatient[]): MockNoteTask[] {
  const tasks: MockNoteTask[] = [];

  let taskIndex = 1;
  for (const patient of patients) {
    if (patient.warningLevel === 'critical') {
      tasks.push({
        id: `task-${taskIndex}`,
        patientId: patient.id,
        taskType: 'REVISIT_REVIEW',
        title: `复诊率严重异常 - ${patient.name}`,
        description: `患者复诊率为${patient.revisitRate.toFixed(1)}%，已严重低于预警阈值，请立即联系患者了解情况并安排复诊。`,
        priority: 'HIGH',
        status: randomChoice(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        conclusion: Math.random() > 0.5 ? '已联系患者，患者因出差延误复诊，已重新预约下周复诊。' : null,
        triggerReason: 'revisit_rate_critical',
        triggerValue: patient.revisitRate,
        thresholdValue: 50,
        createdAt: randomDate(new Date('2025-06-01'), new Date('2025-06-15')).toISOString(),
      });
      taskIndex++;
    } else if (patient.warningLevel === 'warning') {
      tasks.push({
        id: `task-${taskIndex}`,
        patientId: patient.id,
        taskType: 'REVISIT_REVIEW',
        title: `复诊率预警 - ${patient.name}`,
        description: `患者复诊率为${patient.revisitRate.toFixed(1)}%，已低于预警阈值，请关注患者复诊情况。`,
        priority: 'MEDIUM',
        status: randomChoice(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        conclusion: Math.random() > 0.6 ? '已发送提醒短信，患者回复本周内复诊。' : null,
        triggerReason: 'revisit_rate_warning',
        triggerValue: patient.revisitRate,
        thresholdValue: 70,
        createdAt: randomDate(new Date('2025-06-01'), new Date('2025-06-15')).toISOString(),
      });
      taskIndex++;
    }

    if (patient.missedCount >= 3) {
      tasks.push({
        id: `task-${taskIndex}`,
        patientId: patient.id,
        taskType: 'MISSED_REVIEW',
        title: `频繁爽约提醒 - ${patient.name}`,
        description: `患者累计爽约${patient.missedCount}次，需重点关注并制定改进措施。`,
        priority: 'MEDIUM',
        status: randomChoice(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        conclusion: null,
        triggerReason: 'missed_appointment_warning',
        triggerValue: patient.missedCount,
        thresholdValue: 2,
        createdAt: randomDate(new Date('2025-06-01'), new Date('2025-06-15')).toISOString(),
      });
      taskIndex++;
    }
  }

  return tasks.sort((a, b) => {
    const statusOrder = { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 2, CANCELLED: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

export function generateMockFunnelData(): MockFunnelStage[] {
  const stages: TreatmentStage[] = [
    'CONSULTATION',
    'DIAGNOSIS',
    'TREATMENT_PLANNING',
    'BRACKET_PLACEMENT',
    'ACTIVE_TREATMENT',
    'RETENTION',
    'COMPLETED',
  ];

  const counts = [150, 120, 100, 85, 60, 35, 25];
  const missedCounts = [5, 8, 10, 12, 15, 8, 3];
  const revisitRates = [96.7, 93.3, 90.0, 85.9, 75.0, 77.1, 88.0];

  return stages.map((stage, index) => {
    const conversionRate = index === 0 ? 100 : (counts[index] / counts[index - 1]) * 100;
    return {
      stage,
      stageName: stageNames[stage],
      patientCount: counts[index],
      missedCount: missedCounts[index],
      revisitRate: revisitRates[index],
      conversionRate,
    };
  });
}

export function generateMockRevisitRateTrend(): Array<{
  period: string;
  revisitRate: number;
  missedRate: number;
  threshold: number;
}> {
  const periods = ['1月', '2月', '3月', '4月', '5月', '6月'];
  return periods.map((period, index) => ({
    period,
    revisitRate: 85 + Math.sin(index * 0.8) * 8 + (index === 4 ? -5 : 0) + (index === 5 ? -8 : 0),
    missedRate: 15 - Math.sin(index * 0.8) * 5 + (index === 4 ? 3 : 0) + (index === 5 ? 5 : 0),
    threshold: 70,
  }));
}

export function generateMockAppointmentStatusData(): Array<{ name: string; value: number }> {
  return [
    { name: '已完成', value: 320 },
    { name: '已预约', value: 45 },
    { name: '爽约', value: 35 },
    { name: '已取消', value: 15 },
    { name: '已改约', value: 10 },
  ];
}

export function generateMockPaymentStatusData(): Array<{ name: string; value: number }> {
  return [
    { name: '已支付', value: 180 },
    { name: '部分支付', value: 35 },
    { name: '待支付', value: 20 },
    { name: '已退款', value: 5 },
  ];
}
