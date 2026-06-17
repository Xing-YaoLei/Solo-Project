import request from '../utils/request';
import {
  WaterElectricityData,
  InspectionFunnelData,
  PaymentRankingData,
  ComplaintTagsData,
  RepairDurationData,
  PaymentRecord,
  CaliberVersion,
  ImportBatch,
  RepairOrder,
} from '../types';

export const analyticsAPI = {
  syncData: (tables?: string[]) =>
    request.post('/analytics/sync', { tables }) as Promise<{ message: string }>,

  getUtilityReadings: (params?: { start_month?: string; end_month?: string; district?: string }) =>
    request.get('/analytics/utility-readings', { params }) as Promise<WaterElectricityData[]>,

  getInspectionFunnel: () =>
    request.get('/analytics/inspection-funnel') as Promise<InspectionFunnelData[]>,

  getPaymentRanking: (params?: { period?: string; dimension?: string; limit?: number; start_month?: string; end_month?: string }) =>
    request.get('/analytics/payment-ranking', { params }) as Promise<PaymentRankingData[]>,

  getComplaintTagTrend: (params?: { start_month?: string; end_month?: string }) =>
    request.get('/analytics/complaint-tag-trend', { params }) as Promise<ComplaintTagsData[]>,

  getRepairDuration: () =>
    request.get('/analytics/repair-duration') as Promise<RepairDurationData[]>,
};

export const repairAPI = {
  getCaliberVersions: () =>
    request.get('/repair/caliber-versions') as Promise<CaliberVersion[]>,

  getOrders: (params?: { page?: number; page_size?: number; status?: string; worker_id?: number }) =>
    request.get('/repair/orders', { params }) as Promise<{ items: RepairOrder[]; total: number; page: number; page_size: number }>,

  getOrder: (id: number) =>
    request.get(`/repair/orders/${id}`) as Promise<RepairOrder>,
};

export const dataImportAPI = {
  getBatches: (params?: { page?: number; page_size?: number }) =>
    request.get('/import/batches', { params }) as Promise<{ items: ImportBatch[]; total: number; page: number; page_size: number }>,
};

export const paymentAPI = {
  addComment: (id: number, comment: string) =>
    request.post(`/payments/${id}/comment`, { comment }) as Promise<PaymentRecord>,

  getPaymentDetail: (id: number) =>
    request.get(`/payments/${id}`) as Promise<PaymentRecord>,
};
