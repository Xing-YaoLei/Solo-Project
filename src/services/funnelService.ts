import { prisma } from '@/lib/prisma';
import { getThresholdNumberValue } from './thresholdService';
import type { TaskPriority, AppointmentStatus, TreatmentStage } from '@prisma/client';

export interface RevisitRateAnalysis {
  patientId: string;
  patientName: string;
  patientNo: string;
  totalAppointments: number;
  completedAppointments: number;
  missedAppointments: number;
  revisitRate: number;
  isWarning: boolean;
  isCritical: boolean;
  warningLevel: 'normal' | 'warning' | 'critical';
  lastAppointmentDate: Date | null;
  nextAppointmentDate: Date | null;
}

export interface FunnelStageData {
  stage: TreatmentStage;
  stageName: string;
  patientCount: number;
  missedCount: number;
  revisitRate: number;
  conversionRate: number;
}

export async function calculatePatientRevisitRate(patientId: string): Promise<RevisitRateAnalysis> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
        orderBy: { appointmentDate: 'desc' },
      },
    },
  });

  if (!patient) {
    throw new Error('患者不存在');
  }

  const totalAppointments = patient.appointments.length;
  const completedAppointments = patient.appointments.filter(
    (a) => a.status === 'COMPLETED'
  ).length;
  const missedAppointments = patient.appointments.filter(
    (a) => a.status === 'MISSED'
  ).length;

  const revisitRate = totalAppointments > 0
    ? ((totalAppointments - missedAppointments) / totalAppointments) * 100
    : 100;

  const warningThreshold = await getThresholdNumberValue('revisit_rate_warning');
  const criticalThreshold = await getThresholdNumberValue('revisit_rate_critical');

  const isWarning = revisitRate < warningThreshold && revisitRate >= criticalThreshold;
  const isCritical = revisitRate < criticalThreshold;
  const warningLevel = isCritical ? 'critical' : isWarning ? 'warning' : 'normal';

  const completedSorted = patient.appointments
    .filter((a) => a.status === 'COMPLETED')
    .sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime());

  const scheduledSorted = patient.appointments
    .filter((a) => a.status === 'SCHEDULED')
    .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime());

  return {
    patientId: patient.id,
    patientName: patient.name,
    patientNo: patient.patientNo,
    totalAppointments,
    completedAppointments,
    missedAppointments,
    revisitRate,
    isWarning,
    isCritical,
    warningLevel,
    lastAppointmentDate: completedSorted[0]?.appointmentDate || null,
    nextAppointmentDate: scheduledSorted[0]?.appointmentDate || null,
  };
}

export async function getOrthoFunnelData(
  startDate?: Date,
  endDate?: Date
): Promise<FunnelStageData[]> {
  const where: any = { isOrthoCase: true };
  if (startDate || endDate) {
    where.funnelRecords = {
      some: {
        stageDate: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
    };
  }

  const stages: TreatmentStage[] = [
    'CONSULTATION',
    'DIAGNOSIS',
    'TREATMENT_PLANNING',
    'BRACKET_PLACEMENT',
    'ACTIVE_TREATMENT',
    'RETENTION',
    'COMPLETED',
  ];

  const stageNames: Record<TreatmentStage, string> = {
    CONSULTATION: '初诊咨询',
    DIAGNOSIS: '检查诊断',
    TREATMENT_PLANNING: '方案设计',
    BRACKET_PLACEMENT: '托槽佩戴',
    ACTIVE_TREATMENT: '正畸治疗中',
    RETENTION: '保持期',
    COMPLETED: '治疗完成',
  };

  const result: FunnelStageData[] = [];
  let previousCount = 0;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];

    const patientsInStage = await prisma.patient.findMany({
      where: {
        ...where,
        funnelRecords: {
          some: {
            stage,
            ...(startDate && { stageDate: { gte: startDate } }),
            ...(endDate && { stageDate: { lte: endDate } }),
          },
        },
      },
      include: {
        appointments: true,
        funnelRecords: {
          where: { stage },
        },
      },
    });

    const patientCount = patientsInStage.length;
    const missedCount = patientsInStage.filter((p) =>
      p.funnelRecords.some((fr) => fr.stage === stage && fr.isMissed)
    ).length;

    const totalAppointments = patientsInStage.reduce(
      (sum, p) => sum + p.appointments.length,
      0
    );
    const missedAppointments = patientsInStage.reduce(
      (sum, p) => sum + p.appointments.filter((a) => a.status === 'MISSED').length,
      0
    );

    const revisitRate = totalAppointments > 0
      ? ((totalAppointments - missedAppointments) / totalAppointments) * 100
      : 100;

    const conversionRate = i === 0
      ? 100
      : previousCount > 0
        ? (patientCount / previousCount) * 100
        : 0;

    result.push({
      stage,
      stageName: stageNames[stage],
      patientCount,
      missedCount,
      revisitRate,
      conversionRate,
    });

    previousCount = patientCount;
  }

  return result;
}

export async function getMissedAppointmentPatients(
  startDate?: Date,
  endDate?: Date
): Promise<Array<{
  patientId: string;
  patientName: string;
  patientNo: string;
  missedCount: number;
  totalAppointments: number;
  revisitRate: number;
  warningLevel: 'normal' | 'warning' | 'critical';
}>> {
  const warningThreshold = await getThresholdNumberValue('missed_appointment_warning');
  const criticalThreshold = await getThresholdNumberValue('missed_appointment_critical');

  const patients = await prisma.patient.findMany({
    where: { isOrthoCase: true },
    include: {
      appointments: {
        where: {
          ...(startDate && { appointmentDate: { gte: startDate } }),
          ...(endDate && { appointmentDate: { lte: endDate } }),
        },
      },
    },
  });

  const result = patients
    .map((patient) => {
      const totalAppointments = patient.appointments.length;
      const missedCount = patient.appointments.filter(
        (a) => a.status === 'MISSED'
      ).length;
      const revisitRate = totalAppointments > 0
        ? ((totalAppointments - missedCount) / totalAppointments) * 100
        : 100;

      let warningLevel: 'normal' | 'warning' | 'critical' = 'normal';
      if (missedCount >= criticalThreshold) {
        warningLevel = 'critical';
      } else if (missedCount >= warningThreshold) {
        warningLevel = 'warning';
      }

      return {
        patientId: patient.id,
        patientName: patient.name,
        patientNo: patient.patientNo,
        missedCount,
        totalAppointments,
        revisitRate,
        warningLevel,
      };
    })
    .filter((p) => p.missedCount > 0)
    .sort((a, b) => b.missedCount - a.missedCount);

  return result;
}

export async function generateRevisitNoteTask(
  patientId: string,
  triggerReason: string,
  triggerValue: number,
  thresholdValue: number
): Promise<void> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) return;

  const isCritical = triggerValue < (await getThresholdNumberValue('revisit_rate_critical'));
  const priority: TaskPriority = isCritical ? 'HIGH' : 'MEDIUM';

  await prisma.noteTask.create({
    data: {
      patientId,
      taskType: 'REVISIT_REVIEW',
      title: `复诊率异常 - ${patient.name}`,
      description: `患者${patient.name}（${patient.patientNo}）复诊率为${triggerValue.toFixed(1)}%，低于阈值${thresholdValue}%，请及时跟进处理。`,
      priority,
      status: 'PENDING',
      triggerReason,
      triggerValue,
      thresholdValue,
      source: 'auto',
    },
  });
}

export async function checkAndGenerateAlerts(patientId: string): Promise<void> {
  const analysis = await calculatePatientRevisitRate(patientId);

  if (analysis.isWarning || analysis.isCritical) {
    const threshold = analysis.isCritical
      ? await getThresholdNumberValue('revisit_rate_critical')
      : await getThresholdNumberValue('revisit_rate_warning');

    const existingTask = await prisma.noteTask.findFirst({
      where: {
        patientId,
        taskType: 'REVISIT_REVIEW',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
    });

    if (!existingTask) {
      await generateRevisitNoteTask(
        patientId,
        analysis.isCritical ? 'revisit_rate_critical' : 'revisit_rate_warning',
        analysis.revisitRate,
        threshold
      );
    }
  }
}

export async function getReviewMaterial(patientId: string): Promise<{
  patient: any;
  appointments: any[];
  chargeRecords: any[];
  imageAttachments: any[];
  noteTasks: any[];
  revisitAnalysis: RevisitRateAnalysis;
}> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error('患者不存在');
  }

  const [appointments, chargeRecords, imageAttachments, noteTasks, revisitAnalysis] =
    await Promise.all([
      prisma.appointment.findMany({
        where: { patientId },
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.chargeRecord.findMany({
        where: { patientId },
        orderBy: { chargeDate: 'desc' },
      }),
      prisma.imageAttachment.findMany({
        where: { patientId },
        orderBy: { uploadDate: 'desc' },
      }),
      prisma.noteTask.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      calculatePatientRevisitRate(patientId),
    ]);

  return {
    patient,
    appointments,
    chargeRecords,
    imageAttachments,
    noteTasks,
    revisitAnalysis,
  };
}
