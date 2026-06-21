import { apiGet, apiPost } from '@/api/client';
import type {
  ReportRequest,
  ReportData,
  ReportResponse,
  RevenueByPeriod,
  CaseStatusSummary,
  LawyerPerformance,
  CollectionForecast,
  ReconciliationTrendItem,
  ContractAttachmentItem,
  InvoiceDetailItem,
  ApprovalNodeExceptionItem,
  FilterParams,
} from '@/types';

export const reportApi = {
  generateReport: async (data: ReportRequest): Promise<ReportResponse> => {
    return apiPost<ReportResponse>('/reports/generate', data);
  },

  getReportData: async (reportId: string): Promise<ReportData> => {
    return apiGet<ReportData>(`/reports/${reportId}`);
  },

  getRevenueByPeriod: async (params?: FilterParams): Promise<RevenueByPeriod[]> => {
    return apiGet<RevenueByPeriod[]>('/reports/revenue-by-period', { params });
  },

  getCaseStatusSummary: async (params?: FilterParams): Promise<CaseStatusSummary[]> => {
    return apiGet<CaseStatusSummary[]>('/reports/case-status-summary', { params });
  },

  getLawyerPerformance: async (params?: FilterParams): Promise<LawyerPerformance[]> => {
    return apiGet<LawyerPerformance[]>('/reports/lawyer-performance', { params });
  },

  getCollectionForecast: async (params?: FilterParams): Promise<CollectionForecast[]> => {
    return apiGet<CollectionForecast[]>('/reports/collection-forecast', { params });
  },

  getReconciliationTrend: async (params?: FilterParams): Promise<ReconciliationTrendItem[]> => {
    return apiGet<ReconciliationTrendItem[]>('/reports/reconciliation-trend', { params });
  },

  getContractAttachmentComposition: async (
    params?: FilterParams
  ): Promise<ContractAttachmentItem[]> => {
    return apiGet<ContractAttachmentItem[]>('/reports/contract-attachment-composition', {
      params,
    });
  },

  getInvoiceDetails: async (params?: FilterParams): Promise<InvoiceDetailItem[]> => {
    return apiGet<InvoiceDetailItem[]>('/reports/invoice-details', { params });
  },

  getApprovalNodeExceptions: async (
    params?: FilterParams
  ): Promise<ApprovalNodeExceptionItem[]> => {
    return apiGet<ApprovalNodeExceptionItem[]>('/reports/approval-node-exceptions', { params });
  },
};

export default reportApi;
