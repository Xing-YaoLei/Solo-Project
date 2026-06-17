import request from '../utils/request';
import {
  KPIData,
  WaterElectricityData,
  InspectionFunnelData,
  PaymentRankingData,
  ComplaintTagsData,
  RepairDurationData,
  DateRange,
  AreaFilter,
  PaymentRecord,
  CaliberVersion,
  ImportBatch,
  RepairOrder,
} from '../types';

export const dashboardAPI = {
  getKPI: (params?: DateRange & AreaFilter) =>
    request.get<unknown, KPIData>('/dashboard/kpi', { params }),

  getWaterElectricity: (params?: DateRange & AreaFilter) =>
    request.get<unknown, WaterElectricityData[]>('/dashboard/water-electricity', { params }),

  getInspectionFunnel: (params?: DateRange & AreaFilter) =>
    request.get<unknown, InspectionFunnelData[]>('/dashboard/inspection-funnel', { params }),

  getPaymentRanking: (params?: DateRange & AreaFilter) =>
    request.get<unknown, PaymentRankingData[]>('/dashboard/payment-ranking', { params }),

  getComplaintTags: (params?: DateRange & AreaFilter) =>
    request.get<unknown, ComplaintTagsData[]>('/dashboard/complaint-tags', { params }),
};

export const analyticsAPI = {
  getOverview: (params?: DateRange & AreaFilter) =>
    request.get<unknown, { kpi: KPIData; charts: unknown }>('/analytics/overview', { params }),

  getPaymentRecords: (params?: DateRange & AreaFilter & { page?: number; pageSize?: number }) =>
    request.get<unknown, { list: PaymentRecord[]; total: number }>('/analytics/payments', { params }),

  getAreas: () => request.get<unknown, string[]>('/analytics/areas'),
};

export const repairAPI = {
  getDurationTrend: (params?: DateRange & AreaFilter & { caliberVersion?: string }) =>
    request.get<unknown, RepairDurationData[]>('/repair/duration-trend', { params }),

  getOrders: (params?: DateRange & AreaFilter & { page?: number; pageSize?: number; workerId?: string }) =>
    request.get<unknown, { list: RepairOrder[]; total: number }>('/repair/orders', { params }),

  getCaliberVersions: () =>
    request.get<unknown, CaliberVersion[]>('/repair/caliber-versions'),
};

export const dataImportAPI = {
  getBatches: (params?: { page?: number; pageSize?: number }) =>
    request.get<unknown, { list: ImportBatch[]; total: number }>('/import/batches', { params }),

  uploadFile: (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return request.post<unknown, ImportBatch>('/import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const caliberAPI = {
  getVersions: (params?: { page?: number; pageSize?: number }) =>
    request.get<unknown, { list: CaliberVersion[]; total: number }>('/caliber/versions', { params }),

  getVersionDetail: (id: string) =>
    request.get<unknown, CaliberVersion>(`/caliber/versions/${id}`),
};

export const paymentAPI = {
  addComment: (id: string, comment: string) =>
    request.post<unknown, PaymentRecord>(`/payments/${id}/comment`, { comment }),

  getPaymentDetail: (id: string) =>
    request.get<unknown, PaymentRecord>(`/payments/${id}`),
};
