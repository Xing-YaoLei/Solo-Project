import axios from 'axios';
import type {
  RepairOrder,
  RepairPerson,
  Material,
  PaginatedResponse,
  StatisticsOverview,
  SourceStats,
  PersonStats,
  ReviewTagStats,
  DelayReasonStats,
  DailyTrendStats,
  DelayRecord,
  OrderMaterial,
  SignoffProof,
  StatusLog,
  RoutePlan,
} from '../types';
import { OrderStatus, OrderSource, DelayReason, ReviewTag } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const repairOrderApi = {
  list: (params?: {
    status?: OrderStatus;
    source?: OrderSource;
    assignPersonId?: string;
    page?: number;
    pageSize?: number;
    keyword?: string;
  }) => api.get<PaginatedResponse<RepairOrder>>('/repair-orders', { params }).then(r => r.data),

  get: (id: string) => api.get<RepairOrder>(`/repair-orders/${id}`).then(r => r.data),

  create: (data: {
    source: OrderSource;
    apartmentNo: string;
    tenantName: string;
    tenantPhone: string;
    faultType: string;
    faultDesc: string;
    priority?: number;
    planStartTime?: string;
    planEndTime?: string;
  }) => api.post<RepairOrder>('/repair-orders', data).then(r => r.data),

  assign: (id: string, data: {
    assignPersonId: string;
    planStartTime?: string;
    planEndTime?: string;
  }) => api.put<RepairOrder>(`/repair-orders/${id}/assign`, data).then(r => r.data),

  updateStatus: (id: string, data: {
    status: OrderStatus;
    remark?: string;
    operatorId?: string;
  }) => api.put<RepairOrder>(`/repair-orders/${id}/status`, data).then(r => r.data),

  addDelayRecord: (id: string, data: {
    reason: DelayReason;
    detail: string;
    duration: number;
    reporterId: string;
  }) => api.post<DelayRecord>(`/repair-orders/${id}/delay-records`, data).then(r => r.data),

  addMaterial: (id: string, data: {
    materialId: string;
    quantity: number;
  }) => api.post<OrderMaterial>(`/repair-orders/${id}/materials`, data).then(r => r.data),

  removeMaterial: (orderId: string, materialId: string) =>
    api.delete(`/repair-orders/${orderId}/materials/${materialId}`).then(r => r.data),

  createSignoff: (id: string, data: {
    signature?: string;
    photoUrls?: string[];
    remark?: string;
    signedBy: string;
  }) => api.post<SignoffProof>(`/repair-orders/${id}/signoff`, data).then(r => r.data),

  updateReviewTags: (id: string, tags: ReviewTag[]) =>
    api.put<RepairOrder>(`/repair-orders/${id}/review-tags`, { tags }).then(r => r.data),

  close: (id: string, data: {
    closeRemark?: string;
    reviewTags?: ReviewTag[];
  }) => api.post<RepairOrder>(`/repair-orders/${id}/close`, data).then(r => r.data),

  getHistory: (id: string) =>
    api.get<{ order: RepairOrder; statusLogs: StatusLog[] }>(`/repair-orders/${id}/history`).then(r => r.data),
};

export const materialApi = {
  list: (params?: {
    isCommon?: boolean;
    category?: string;
    keyword?: string;
  }) => api.get<Material[]>('/materials', { params }).then(r => r.data),

  getCommon: () => api.get<Material[]>('/materials/common').then(r => r.data),

  getCategories: () => api.get<string[]>('/materials/categories').then(r => r.data),

  get: (id: string) => api.get<Material>(`/materials/${id}`).then(r => r.data),

  create: (data: any) => api.post<Material>('/materials', data).then(r => r.data),

  update: (id: string, data: any) => api.put<Material>(`/materials/${id}`, data).then(r => r.data),

  remove: (id: string) => api.delete(`/materials/${id}`).then(r => r.data),
};

export const repairPersonApi = {
  list: (params?: { status?: string; skill?: string }) =>
    api.get<RepairPerson[]>('/repair-persons', { params }).then(r => r.data),

  get: (id: string) => api.get<RepairPerson>(`/repair-persons/${id}`).then(r => r.data),

  getStats: (id: string, startDate?: string, endDate?: string) =>
    api.get(`/repair-persons/${id}/stats`, { params: { startDate, endDate } }).then(r => r.data),

  create: (data: any) => api.post<RepairPerson>('/repair-persons', data).then(r => r.data),

  update: (id: string, data: any) => api.put<RepairPerson>(`/repair-persons/${id}`, data).then(r => r.data),

  remove: (id: string) => api.delete(`/repair-persons/${id}`).then(r => r.data),
};

export const statisticsApi = {
  overview: (startDate?: string, endDate?: string) =>
    api.get<StatisticsOverview>('/statistics/overview', { params: { startDate, endDate } }).then(r => r.data),

  bySource: (startDate?: string, endDate?: string) =>
    api.get<SourceStats[]>('/statistics/by-source', { params: { startDate, endDate } }).then(r => r.data),

  byPerson: (startDate?: string, endDate?: string) =>
    api.get<PersonStats[]>('/statistics/by-person', { params: { startDate, endDate } }).then(r => r.data),

  byReviewTags: (startDate?: string, endDate?: string) =>
    api.get<ReviewTagStats[]>('/statistics/by-review-tags', { params: { startDate, endDate } }).then(r => r.data),

  delayReasons: (startDate?: string, endDate?: string) =>
    api.get<DelayReasonStats[]>('/statistics/delay-reasons', { params: { startDate, endDate } }).then(r => r.data),

  dailyTrend: (days?: number) =>
    api.get<DailyTrendStats[]>('/statistics/daily-trend', { params: { days } }).then(r => r.data),
};

export const routePlanApi = {
  getByOrderId: (orderId: string) =>
    api.get<RoutePlan[]>(`/route-plans/order/${orderId}`).then(r => r.data),

  create: (orderId: string, data: any) =>
    api.post<RoutePlan>(`/route-plans/order/${orderId}`, data).then(r => r.data),

  update: (id: string, data: any) =>
    api.put<RoutePlan>(`/route-plans/${id}`, data).then(r => r.data),

  remove: (id: string) => api.delete(`/route-plans/${id}`).then(r => r.data),

  start: (id: string) => api.put<RoutePlan>(`/route-plans/${id}/start`).then(r => r.data),

  arrive: (id: string) => api.put<RoutePlan>(`/route-plans/${id}/arrive`).then(r => r.data),

  reorder: (orderId: string, orderIds: string[]) =>
    api.post(`/route-plans/order/${orderId}/reorder`, { orderIds }).then(r => r.data),
};

export default api;
