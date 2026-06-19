import type {
  Complaint,
  ComplaintDetail,
  SyncNode,
  SyncLog,
  SyncFlow,
  SyncStats,
  SyncBatch,
  KPIData,
  TrendData,
  HeatmapData,
  OverdueWarning,
  EscalationTimelineData,
  DurationReport,
  RegionReport,
  DateReport,
  ComparisonReport,
  CallbackStats,
  PieDataItem,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const getKPI = (params?: { startDate?: string; endDate?: string; region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<KPIData>(`/complaints/kpi?${searchParams.toString()}`);
};

export const getTrend = (params?: { period?: '7d' | '30d' | '90d'; region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<TrendData>(`/complaints/trend?${searchParams.toString()}`);
};

export const getHeatmap = (params?: { region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.region) searchParams.append('region', params.region);
  return request<HeatmapData>(`/complaints/heatmap?${searchParams.toString()}`);
};

export const getOverdueWarning = (params?: { region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.region) searchParams.append('region', params.region);
  return request<OverdueWarning[]>(`/complaints/overdue-warning?${searchParams.toString()}`);
};

export const getComplaints = (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  severity?: string;
  category?: string;
  region?: string;
  search?: string;
}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, String(value));
  });
  return request<{ data: Complaint[]; total: number; page: number; pageSize: number }>(
    `/complaints?${searchParams.toString()}`
  );
};

export const getComplaintDetail = (id: string) =>
  request<ComplaintDetail>(`/complaints/${id}`);

export const updateComplaint = (id: string, data: any) =>
  request<{ success: boolean }>(`/complaints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const createComplaint = (data: any) =>
  request<{ id: string; success: boolean }>('/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getCallbackStats = (params?: { startDate?: string; endDate?: string; region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<CallbackStats[]>(`/complaints/callback/stats?${searchParams.toString()}`);
};

export const getEscalationTimeline = (params?: { days?: number; region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.days) searchParams.append('days', String(params.days));
  if (params?.region) searchParams.append('region', params.region);
  return request<EscalationTimelineData>(`/escalations/timeline?${searchParams.toString()}`);
};

export const getEscalationList = (params?: { region?: string; level?: string; page?: number; pageSize?: number }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<{ data: Complaint[]; total: number }>(`/escalations/list?${searchParams.toString()}`);
};

export const getSyncFlow = (params?: { sourceType?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.sourceType) searchParams.append('sourceType', params.sourceType);
  return request<SyncFlow[]>(`/sync/audit/flow?${searchParams.toString()}`);
};

export const getSyncStats = () =>
  request<SyncStats[]>('/sync/stats/recent');

export const getSyncNodes = (params?: { sourceType?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.sourceType) searchParams.append('sourceType', params.sourceType);
  return request<SyncNode[]>('/sync/nodes');
};

export const getNodeLogs = (nodeId: string, params?: { page?: number; pageSize?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', String(params.page));
  if (params?.pageSize) searchParams.append('pageSize', String(params.pageSize));
  return request<{ data: SyncLog[]; total: number }>(`/sync/nodes/${nodeId}/logs?${searchParams.toString()}`);
};

export const getBatches = (params?: { sourceType?: string; status?: string; page?: number; pageSize?: number }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<{ data: SyncBatch[]; total: number }>(`/sync/batches?${searchParams.toString()}`);
};

export const getBatchNodes = (batchId: string) =>
  request<any[]>(`/sync/batches/${batchId}/nodes`);

export const getReportsByDuration = (params?: { region?: string; startDate?: string; endDate?: string }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<DurationReport>(`/reports/by-duration?${searchParams.toString()}`);
};

export const getReportsByRegion = (params?: { startDate?: string; endDate?: string }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<RegionReport[]>('/reports/by-region');
};

export const getReportsByDate = (params?: { days?: number; region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.days) searchParams.append('days', String(params.days));
  if (params?.region) searchParams.append('region', params.region);
  return request<DateReport>(`/reports/by-date?${searchParams.toString()}`);
};

export const getReportsComparison = (params?: { region?: string; period1Start?: string; period1End?: string; period2Start?: string; period2End?: string }) => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, String(value));
    });
  }
  return request<ComparisonReport>(`/reports/comparison?${searchParams.toString()}`);
};

export const getResponsibility = (params?: { region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.region) searchParams.append('region', params.region);
  return request<PieDataItem[]>(`/reports/responsibility?${searchParams.toString()}`);
};

export const getCategory = (params?: { region?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.region) searchParams.append('region', params.region);
  return request<PieDataItem[]>('/reports/category');
};
