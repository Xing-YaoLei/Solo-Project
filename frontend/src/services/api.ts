import axios from 'axios';
import type {
  FunnelStage,
  EquipmentStatusItem,
  InspectionPassRate,
  OfflineEquipment,
  StoreWithStats,
  PageResult,
  ThresholdConfig,
  EquipmentRemark,
  ApiResponse,
  ReviewMaterial,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const reportsApi = {
  getFunnel: (params?: { start_date?: string; end_date?: string }) =>
    api.get<any, ApiResponse<FunnelStage[]>>('/reports/funnel', { params }),

  getEquipmentStatus: () =>
    api.get<any, ApiResponse<EquipmentStatusItem[]>>('/reports/equipment-status'),

  getInspectionPassRate: (params?: { start_date?: string; end_date?: string }) =>
    api.get<any, ApiResponse<InspectionPassRate>>('/reports/inspection-pass-rate', { params }),

  getOfflineEquipments: () =>
    api.get<any, ApiResponse<OfflineEquipment[]>>('/reports/offline-equipments'),

  getStores: (params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
    status_filter?: string;
  }) =>
    api.get<any, ApiResponse<PageResult<StoreWithStats>>>('/reports/stores', { params }),

  getReviewMaterial: (params?: { start_date?: string; end_date?: string }) =>
    api.get<any, ApiResponse<ReviewMaterial>>('/reports/review-material', { params }),
};

export const thresholdsApi = {
  list: (category?: string) =>
    api.get<any, ThresholdConfig[]>('/thresholds', { params: { category } }),

  get: (configKey: string) =>
    api.get<any, ThresholdConfig>(`/thresholds/${configKey}`),

  update: (configKey: string, data: Partial<ThresholdConfig>) =>
    api.put<any, ThresholdConfig>(`/thresholds/${configKey}`, data),
};

export const remarksApi = {
  listByEquipment: (equipmentId: number, remarkType?: string) =>
    api.get<any, EquipmentRemark[]>(`/remarks/equipment/${equipmentId}`, {
      params: { remark_type: remarkType },
    }),

  listByStore: (storeId: number, remarkType?: string) =>
    api.get<any, EquipmentRemark[]>(`/remarks/store/${storeId}`, {
      params: { remark_type: remarkType },
    }),

  create: (data: {
    equipment_id: number;
    store_id: number;
    remark_type: string;
    content: string;
    operator?: string;
    related_date?: string;
  }) => api.post<any, EquipmentRemark>('/remarks', data),

  delete: (id: number) => api.delete<any, { message: string }>(`/remarks/${id}`),
};

export default api;
