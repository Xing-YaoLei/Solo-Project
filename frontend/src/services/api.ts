import type {
  ApiResponse,
  FunnelData,
  CoreMetrics,
  RiskEvent,
  ActivityTrendItem,
  ActivityTimeDistribution,
  BedAreaComparison,
  RiskTypeDistribution,
  RiskDailyTrend,
  RiskEventListResponse,
  ResidentProfile,
  BedUtilization,
  CareLevelDistribution,
  AgeDistribution,
  DiseaseDistribution,
  ThresholdConfig,
  ThresholdChangeLog,
  FallReview,
  FallEventSummary,
} from '@/types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.message || '请求失败');
  }
  return data.data;
}

export const dashboardApi = {
  getFunnel: () => request<FunnelData[]>('/dashboard/funnel'),
  getMetrics: () => request<CoreMetrics>('/dashboard/metrics'),
  getRecentRisks: (limit = 10) => request<RiskEvent[]>(`/dashboard/recent-risks?limit=${limit}`),
};

export const activityApi = {
  getTrend: (days = 30) => request<ActivityTrendItem[]>(`/activity/trend?days=${days}`),
  getTimeDistribution: () => request<ActivityTimeDistribution[]>('/activity/time-distribution'),
  getBedAreaComparison: () => request<BedAreaComparison[]>('/activity/bed-area-comparison'),
};

export const riskApi = {
  getEvents: (page = 1, pageSize = 20, eventType?: string, level?: string) => {
    let url = `/risk/events?page=${page}&pageSize=${pageSize}`;
    if (eventType) url += `&event_type=${eventType}`;
    if (level) url += `&level=${level}`;
    return request<RiskEventListResponse>(url);
  },
  getTypeDistribution: (days = 30) =>
    request<RiskTypeDistribution[]>(`/risk/type-distribution?days=${days}`),
  getDailyTrend: (days = 30) =>
    request<RiskDailyTrend[]>(`/risk/daily-trend?days=${days}`),
  addRemark: (eventId: string, remark: string) =>
    request<RiskEvent>(`/risk/events/${eventId}/remark`, {
      method: 'PUT',
      body: JSON.stringify({ remark }),
    }),
};

export const residentApi = {
  getResidents: (page = 1, pageSize = 20, careLevel?: string) => {
    let url = `/residents?page=${page}&pageSize=${pageSize}`;
    if (careLevel) url += `&care_level=${careLevel}`;
    return request<{ list: ResidentProfile[]; total: number }>(url);
  },
  getBedUtilization: () => request<BedUtilization[]>('/residents/bed-utilization'),
  getCareLevelDistribution: () =>
    request<CareLevelDistribution[]>('/residents/care-level-distribution'),
  getAgeDistribution: () => request<AgeDistribution[]>('/residents/age-distribution'),
  getDiseaseDistribution: () =>
    request<DiseaseDistribution[]>('/residents/disease-distribution'),
};

export const thresholdApi = {
  getAll: () => request<ThresholdConfig[]>('/thresholds'),
  update: (id: string, warningThreshold: number, criticalThreshold: number) =>
    request<ThresholdConfig>(`/thresholds/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ warningThreshold, criticalThreshold }),
    }),
  getChangeLogs: (thresholdId?: string, limit = 20) => {
    let url = `/thresholds/change-logs?limit=${limit}`;
    if (thresholdId) url += `&threshold_id=${thresholdId}`;
    return request<ThresholdChangeLog[]>(url);
  },
};

export const reviewApi = {
  getFallReview: (eventId: string) =>
    request<FallReview>(`/review/fall/${eventId}`),
  getFallEvents: (limit = 20) =>
    request<FallEventSummary[]>(`/review/fall-events?limit=${limit}`),
};
