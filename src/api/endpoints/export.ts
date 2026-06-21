import { apiGet, apiPost } from '@/api/client';
import type {
  ExportRequest,
  ExportResponse,
  ExportProgress,
} from '@/types';

export const exportApi = {
  requestExport: async (data: ExportRequest): Promise<ExportResponse> => {
    return apiPost<ExportResponse>('/exports', data);
  },

  getExportStatus: async (exportId: string): Promise<ExportResponse> => {
    return apiGet<ExportResponse>(`/exports/${exportId}`);
  },

  getExportProgress: async (exportId: string): Promise<ExportProgress> => {
    return apiGet<ExportProgress>(`/exports/${exportId}/progress`);
  },

  getExports: async (): Promise<ExportResponse[]> => {
    return apiGet<ExportResponse[]>('/exports');
  },

  downloadExport: async (exportId: string): Promise<Blob> => {
    const { apiDownload } = await import('@/api/client');
    return apiDownload(`/exports/${exportId}/download`);
  },

  cancelExport: async (exportId: string): Promise<void> => {
    return apiPost<void>(`/exports/${exportId}/cancel`);
  },
};

export default exportApi;
