import { generateDeduplicationKey } from '@/lib/utils';
import type { DataSource, Patient, Appointment, ChargeRecord } from '@prisma/client';

export interface RawPatientData {
  patientNo?: string;
  name?: string;
  gender?: string;
  birthDate?: string | Date;
  phone?: string;
  idCardNo?: string;
  address?: string;
  hisPatientId?: string;
  source?: DataSource;
}

export interface RawAppointmentData {
  appointmentNo?: string;
  patientNo?: string;
  hisPatientId?: string;
  appointmentDate?: string | Date;
  appointmentType?: string;
  status?: string;
  doctor?: string;
  department?: string;
  source?: DataSource;
  hisAppointmentId?: string;
  missedReason?: string;
}

export interface RawChargeData {
  chargeNo?: string;
  patientNo?: string;
  hisPatientId?: string;
  chargeDate?: string | Date;
  amount?: number | string;
  itemName?: string;
  itemType?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  source?: DataSource;
  hisChargeId?: string;
}

export interface CleanResult<T> {
  cleaned: T[];
  duplicates: T[];
  invalid: { data: T; reason: string }[];
  stats: {
    total: number;
    cleaned: number;
    duplicates: number;
    invalid: number;
  };
}

const statusMapping: Record<string, string> = {
  '已预约': 'SCHEDULED',
  '已完成': 'COMPLETED',
  '爽约': 'MISSED',
  '已取消': 'CANCELLED',
  '已改约': 'RESCHEDULED',
  'scheduled': 'SCHEDULED',
  'completed': 'COMPLETED',
  'missed': 'MISSED',
  'cancelled': 'CANCELLED',
  'rescheduled': 'RESCHEDULED',
  'SCHEDULED': 'SCHEDULED',
  'COMPLETED': 'COMPLETED',
  'MISSED': 'MISSED',
  'CANCELLED': 'CANCELLED',
  'RESCHEDULED': 'RESCHEDULED',
};

const paymentStatusMapping: Record<string, string> = {
  '待支付': 'PENDING',
  '已支付': 'PAID',
  '部分支付': 'PARTIAL',
  '已退款': 'REFUNDED',
  'pending': 'PENDING',
  'paid': 'PAID',
  'partial': 'PARTIAL',
  'refunded': 'REFUNDED',
  'PENDING': 'PENDING',
  'PAID': 'PAID',
  'PARTIAL': 'PARTIAL',
  'REFUNDED': 'REFUNDED',
};

const genderMapping: Record<string, string> = {
  '男': '男',
  '女': '女',
  'male': '男',
  'female': '女',
  'M': '男',
  'F': '女',
  '1': '男',
  '2': '女',
};

export function cleanPatientData(rawData: RawPatientData[]): CleanResult<RawPatientData> {
  const seen = new Set<string>();
  const cleaned: RawPatientData[] = [];
  const duplicates: RawPatientData[] = [];
  const invalid: { data: RawPatientData; reason: string }[] = [];

  for (const raw of rawData) {
    if (!raw.patientNo && !raw.hisPatientId) {
      invalid.push({ data: raw, reason: '缺少患者编号' });
      continue;
    }

    if (!raw.name) {
      invalid.push({ data: raw, reason: '缺少患者姓名' });
      continue;
    }

    const dedupKey = generateDeduplicationKey(
      raw.patientNo,
      raw.hisPatientId,
      raw.idCardNo,
      raw.name
    );

    if (seen.has(dedupKey)) {
      duplicates.push(raw);
      continue;
    }
    seen.add(dedupKey);

    const cleanedRecord: RawPatientData = {
      ...raw,
      patientNo: raw.patientNo?.trim(),
      name: raw.name?.trim(),
      gender: raw.gender ? genderMapping[raw.gender] || raw.gender : undefined,
      phone: raw.phone?.trim().replace(/\D/g, ''),
      idCardNo: raw.idCardNo?.trim(),
      address: raw.address?.trim(),
      hisPatientId: raw.hisPatientId?.trim(),
    };

    cleaned.push(cleanedRecord);
  }

  return {
    cleaned,
    duplicates,
    invalid,
    stats: {
      total: rawData.length,
      cleaned: cleaned.length,
      duplicates: duplicates.length,
      invalid: invalid.length,
    },
  };
}

export function cleanAppointmentData(rawData: RawAppointmentData[]): CleanResult<RawAppointmentData> {
  const seen = new Set<string>();
  const cleaned: RawAppointmentData[] = [];
  const duplicates: RawAppointmentData[] = [];
  const invalid: { data: RawAppointmentData; reason: string }[] = [];

  for (const raw of rawData) {
    if (!raw.appointmentNo && !raw.hisAppointmentId) {
      invalid.push({ data: raw, reason: '缺少预约编号' });
      continue;
    }

    if (!raw.patientNo && !raw.hisPatientId) {
      invalid.push({ data: raw, reason: '缺少患者标识' });
      continue;
    }

    if (!raw.appointmentDate) {
      invalid.push({ data: raw, reason: '缺少预约日期' });
      continue;
    }

    const dedupKey = generateDeduplicationKey(
      raw.appointmentNo,
      raw.hisAppointmentId,
      raw.patientNo,
      raw.appointmentDate instanceof Date ? raw.appointmentDate.toISOString() : raw.appointmentDate
    );

    if (seen.has(dedupKey)) {
      duplicates.push(raw);
      continue;
    }
    seen.add(dedupKey);

    const normalizedStatus = raw.status ? statusMapping[raw.status] || 'SCHEDULED' : 'SCHEDULED';

    const cleanedRecord: RawAppointmentData = {
      ...raw,
      appointmentNo: raw.appointmentNo?.trim(),
      patientNo: raw.patientNo?.trim(),
      hisPatientId: raw.hisPatientId?.trim(),
      hisAppointmentId: raw.hisAppointmentId?.trim(),
      status: normalizedStatus,
      doctor: raw.doctor?.trim(),
      department: raw.department?.trim(),
      appointmentType: raw.appointmentType?.trim(),
      missedReason: raw.missedReason?.trim(),
    };

    cleaned.push(cleanedRecord);
  }

  return {
    cleaned,
    duplicates,
    invalid,
    stats: {
      total: rawData.length,
      cleaned: cleaned.length,
      duplicates: duplicates.length,
      invalid: invalid.length,
    },
  };
}

export function cleanChargeData(rawData: RawChargeData[]): CleanResult<RawChargeData> {
  const seen = new Set<string>();
  const cleaned: RawChargeData[] = [];
  const duplicates: RawChargeData[] = [];
  const invalid: { data: RawChargeData; reason: string }[] = [];

  for (const raw of rawData) {
    if (!raw.chargeNo && !raw.hisChargeId) {
      invalid.push({ data: raw, reason: '缺少收费编号' });
      continue;
    }

    if (!raw.patientNo && !raw.hisPatientId) {
      invalid.push({ data: raw, reason: '缺少患者标识' });
      continue;
    }

    const amount = typeof raw.amount === 'string' ? parseFloat(raw.amount) : raw.amount;
    if (isNaN(amount!)) {
      invalid.push({ data: raw, reason: '无效的金额' });
      continue;
    }

    const dedupKey = generateDeduplicationKey(
      raw.chargeNo,
      raw.hisChargeId,
      raw.patientNo,
      raw.itemName,
      raw.amount
    );

    if (seen.has(dedupKey)) {
      duplicates.push(raw);
      continue;
    }
    seen.add(dedupKey);

    const normalizedPaymentStatus = raw.paymentStatus
      ? paymentStatusMapping[raw.paymentStatus] || 'PENDING'
      : 'PENDING';

    const cleanedRecord: RawChargeData = {
      ...raw,
      chargeNo: raw.chargeNo?.trim(),
      patientNo: raw.patientNo?.trim(),
      hisPatientId: raw.hisPatientId?.trim(),
      hisChargeId: raw.hisChargeId?.trim(),
      amount: amount,
      itemName: raw.itemName?.trim(),
      itemType: raw.itemType?.trim(),
      paymentStatus: normalizedPaymentStatus,
      paymentMethod: raw.paymentMethod?.trim(),
    };

    cleaned.push(cleanedRecord);
  }

  return {
    cleaned,
    duplicates,
    invalid,
    stats: {
      total: rawData.length,
      cleaned: cleaned.length,
      duplicates: duplicates.length,
      invalid: invalid.length,
    },
  };
}

export function matchPatientByKeys(
  rawData: RawPatientData | RawAppointmentData | RawChargeData,
  existingPatients: Array<Pick<Patient, 'id' | 'patientNo' | 'hisPatientId' | 'idCardNo' | 'name'>>
): string | null {
  const patientNo = 'patientNo' in rawData ? rawData.patientNo : undefined;
  const hisPatientId = 'hisPatientId' in rawData ? rawData.hisPatientId : undefined;
  const idCardNo = 'idCardNo' in rawData ? rawData.idCardNo : undefined;

  if (patientNo) {
    const match = existingPatients.find((p) => p.patientNo === patientNo);
    if (match) return match.id;
  }

  if (hisPatientId) {
    const match = existingPatients.find((p) => p.hisPatientId === hisPatientId);
    if (match) return match.id;
  }

  if (idCardNo) {
    const match = existingPatients.find((p) => p.idCardNo === idCardNo);
    if (match) return match.id;
  }

  return null;
}
