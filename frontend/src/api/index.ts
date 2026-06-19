import axios from 'axios';
import type {
  FunnelData,
  FunnelStage,
  TimeoutInterval,
  AnomalyFlag,
  ReviewNote,
  DateRange,
  AnomalyFetchParams,
  NoteCreateData,
  NoteUpdateData,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function mapFunnelResponse(raw: Record<string, unknown>): FunnelData {
  const funnelStages = (raw.funnel as Record<string, unknown>[]) ?? [];
  const stages: FunnelStage[] = funnelStages.map((s, i) => ({
    stageName: (s.stage_name as string) ?? '',
    stageOrder: (s.stage_order as number) ?? i + 1,
    complaintCount: (s.complaint_count as number) ?? 0,
    avgDurationHours: (s.avg_duration_hours as number) ?? 0,
    dateRecorded: new Date().toISOString(),
  }));

  const timeoutIntervals: TimeoutInterval[] = ((raw.timeout_intervals as Record<string, unknown>[]) ?? []).map(
    (item) => ({
      startDate: (item.start_date as string) ?? '',
      endDate: (item.end_date as string) ?? '',
      avgDurationHours: (item.avg_duration_hours as number) ?? 0,
      affectedStages: (item.affected_stages as string[]) ?? [],
    }),
  );

  return { stages, timeoutIntervals };
}

export async function fetchFunnelData(dateRange: DateRange): Promise<FunnelData> {
  const res = await api.get('/funnel', {
    params: { date_start: dateRange.start, date_end: dateRange.end },
  });
  return mapFunnelResponse(res.data);
}

export async function fetchTimeoutIntervals(): Promise<TimeoutInterval[]> {
  const res = await api.get('/funnel/timeout-intervals');
  const items = (res.data.intervals ?? res.data) as Record<string, unknown>[];
  return items.map((item) => ({
    startDate: (item.start_date as string) ?? '',
    endDate: (item.end_date as string) ?? '',
    avgDurationHours: (item.avg_duration_hours as number) ?? 0,
    affectedStages: (item.affected_stages as string[]) ?? [],
  }));
}

function mapAnomalyFlag(raw: Record<string, unknown>): AnomalyFlag {
  return {
    id: String(raw.id),
    complaintId: String(raw.complaint_id),
    flagType: raw.flag_type as AnomalyFlag['flagType'],
    description: (raw.description as string) ?? '',
    detectedAt: (raw.detected_at as string) ?? '',
    severity: (raw.severity as AnomalyFlag['severity']) ?? 'low',
  };
}

export async function fetchAnomalies(params?: AnomalyFetchParams): Promise<AnomalyFlag[]> {
  const mapped: Record<string, unknown> = {};
  if (params?.flagType) mapped.flag_type = params.flagType;
  if (params?.severity) mapped.severity = params.severity;
  if (params?.complaintId) mapped.complaint_id = params.complaintId;
  const res = await api.get('/anomalies', { params: mapped });
  const items = res.data as Record<string, unknown>[];
  return items.map(mapAnomalyFlag);
}

export async function fetchAnomaliesByComplaint(id: string): Promise<AnomalyFlag[]> {
  const res = await api.get(`/anomalies/complaint/${id}`);
  const items = res.data as Record<string, unknown>[];
  return items.map(mapAnomalyFlag);
}

export async function detectAnomalies(): Promise<AnomalyFlag[]> {
  const res = await api.post('/anomalies/detect');
  const items = (res.data.anomalies ?? res.data) as Record<string, unknown>[];
  return items.map(mapAnomalyFlag);
}

function mapReviewNote(raw: Record<string, unknown>): ReviewNote {
  return {
    id: String(raw.id),
    complaintId: String(raw.complaint_id),
    anomalyFlagId: raw.anomaly_flag_id != null ? String(raw.anomaly_flag_id) : undefined,
    content: (raw.content as string) ?? '',
    author: (raw.author as string) ?? '',
    createdAt: (raw.created_at as string) ?? '',
  };
}

export async function fetchNotesByComplaint(id: string): Promise<ReviewNote[]> {
  const res = await api.get(`/notes/complaint/${id}`);
  const items = res.data as Record<string, unknown>[];
  return items.map(mapReviewNote);
}

export async function createNote(data: NoteCreateData): Promise<ReviewNote> {
  const payload = {
    complaint_id: Number(data.complaintId),
    anomaly_flag_id: data.anomalyFlagId ? Number(data.anomalyFlagId) : null,
    content: data.content,
    author: data.author,
  };
  const res = await api.post('/notes', payload);
  return mapReviewNote(res.data);
}

export async function updateNote(id: string, data: NoteUpdateData): Promise<ReviewNote> {
  const res = await api.put(`/notes/${id}`, data);
  return mapReviewNote(res.data);
}

export async function exportReport(format: 'csv' | 'excel', dateRange: DateRange): Promise<Blob> {
  const fmt = format === 'excel' ? 'xlsx' : 'csv';
  const res = await api.get('/export', {
    params: { format: fmt, date_start: dateRange.start, date_end: dateRange.end },
    responseType: 'blob',
  });
  return res.data;
}
