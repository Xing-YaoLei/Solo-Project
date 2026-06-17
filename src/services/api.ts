import type {
  ScheduleTrendData,
  RiskAnnotation,
  ReviewNote,
  MedicationRecord,
  VisitRecord,
  ActivityRecord,
  ExportRequest,
  ComplianceRule,
} from '@/types';

const BASE = 'http://localhost:8000/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function convertObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = convertObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        item && typeof item === 'object' ? convertObject(item as Record<string, unknown>) : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

function convertMedication(record: Record<string, unknown>): MedicationRecord {
  const r = convertObject(record) as Record<string, unknown>;
  const statusMap: Record<string, string> = {
    '按时': 'completed',
    '延迟': 'delayed',
    '未执行': 'missed',
  };
  return {
    id: String(r.id),
    elderId: String(r.elderId),
    elderName: String(r.elderName || ''),
    medicationName: String(r.medicationName),
    scheduledTime: String(r.scheduledTime),
    actualTime: r.actualTime ? String(r.actualTime) : null,
    status: statusMap[String(r.status)] || String(r.status),
    terminalDelay: r.terminalDelay ? Number(r.terminalDelay) : null,
  };
}

function convertVisit(record: Record<string, unknown>): VisitRecord {
  const r = convertObject(record) as Record<string, unknown>;
  return {
    id: String(r.id),
    elderId: String(r.elderId),
    elderName: String(r.elderName || ''),
    visitorName: String(r.visitorName),
    visitorRelation: String(r.visitorRelation || ''),
    visitTime: String(r.scheduledTime || r.visitTime),
    leaveTime: r.actualTime ? String(r.actualTime) : null,
    accessRecordExists: Boolean(r.accessRecordExists),
    missingStart: r.missingStart ? String(r.missingStart) : null,
    missingEnd: r.missingEnd ? String(r.missingEnd) : null,
  };
}

function convertActivity(record: Record<string, unknown>): ActivityRecord {
  const r = convertObject(record) as Record<string, unknown>;
  const attendees = Array.isArray(r.attendees) ? r.attendees.map((a) => {
    const att = convertObject(a as Record<string, unknown>);
    const status = String(att.status);
    return {
      elderId: String(att.elderId),
      elderName: String(att.elderName),
      checkInTime: att.checkInTime ? String(att.checkInTime) : null,
      status: ((status === 'checked_in' || status === 'absent') ? status : 'absent') as 'checked_in' | 'absent',
    };
  }) : [];
  return {
    id: String(r.id),
    activityName: String(r.activityName),
    activityDate: String(r.activityDate),
    startTime: String(r.startTime),
    endTime: String(r.endTime),
    location: String(r.location),
    attendees,
  };
}

function convertReviewNote(note: Record<string, unknown>): ReviewNote {
  const n = convertObject(note) as Record<string, unknown>;
  return {
    id: String(n.id),
    annotationId: String(n.annotationId),
    author: String(n.author),
    content: String(n.content),
    createdAt: String(n.createdAt),
  };
}

export async function getScheduleTrend(
  startDate: string,
  endDate: string,
): Promise<ScheduleTrendData[]> {
  return request<ScheduleTrendData[]>(
    `${BASE}/schedule/trend?start_date=${startDate}&end_date=${endDate}`,
  );
}

export async function getRiskAnnotations(
  startDate?: string,
  endDate?: string,
): Promise<RiskAnnotation[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return request<RiskAnnotation[]>(
    `${BASE}/schedule/annotations?${params.toString()}`,
  );
}

export async function createReviewNote(
  annotationId: string,
  author: string,
  content: string,
): Promise<ReviewNote> {
  const data = await request<Record<string, unknown>>(
    `${BASE}/annotations/${annotationId}/review-notes`,
    {
      method: 'POST',
      body: JSON.stringify({ author, content }),
    },
  );
  return convertReviewNote(data);
}

export async function getReviewNotes(
  annotationId: string,
): Promise<ReviewNote[]> {
  const data = await request<Record<string, unknown>[]>(
    `${BASE}/annotations/${annotationId}/review-notes`,
  );
  return data.map(convertReviewNote);
}

export async function getMedicationRecords(
  elderId?: string,
): Promise<MedicationRecord[]> {
  const params = elderId ? `?elder_id=${elderId}` : '';
  const data = await request<Record<string, unknown>[]>(`${BASE}/medications${params}`);
  return data.map(convertMedication);
}

export async function getVisitRecords(
  elderId?: string,
): Promise<VisitRecord[]> {
  const params = elderId ? `?elder_id=${elderId}` : '';
  const data = await request<Record<string, unknown>[]>(`${BASE}/visits${params}`);
  return data.map(convertVisit);
}

export async function getActivityRecords(
  date: string,
): Promise<ActivityRecord[]> {
  const data = await request<Record<string, unknown>[]>(
    `${BASE}/activities?date=${date}`,
  );
  return data.map(convertActivity);
}

export async function exportData(req: ExportRequest): Promise<Blob> {
  const res = await fetch(`${BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      start_date: req.startDate,
      end_date: req.endDate,
      view_type: req.viewType,
      format: req.format,
      include_compliance_rules: req.includeComplianceRules,
    }),
  });
  if (!res.ok) throw new Error(`Export error: ${res.status}`);
  return res.blob();
}

export async function getComplianceRules(): Promise<ComplianceRule[]> {
  return request<ComplianceRule[]>(`${BASE}/export/compliance-rules`);
}
