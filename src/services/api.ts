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
  content: string,
): Promise<ReviewNote> {
  return request<ReviewNote>(`${BASE}/review-notes`, {
    method: 'POST',
    body: JSON.stringify({ annotation_id: annotationId, content }),
  });
}

export async function getReviewNotes(
  annotationId: string,
): Promise<ReviewNote[]> {
  return request<ReviewNote[]>(
    `${BASE}/review-notes?annotation_id=${annotationId}`,
  );
}

export async function getMedicationRecords(
  elderId?: string,
): Promise<MedicationRecord[]> {
  const params = elderId ? `?elder_id=${elderId}` : '';
  return request<MedicationRecord[]>(`${BASE}/medication-records${params}`);
}

export async function getVisitRecords(
  startDate: string,
  endDate: string,
): Promise<VisitRecord[]> {
  return request<VisitRecord[]>(
    `${BASE}/visit-records?start_date=${startDate}&end_date=${endDate}`,
  );
}

export async function getActivityRecords(
  date: string,
): Promise<ActivityRecord[]> {
  return request<ActivityRecord[]>(
    `${BASE}/activity-records?date=${date}`,
  );
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
