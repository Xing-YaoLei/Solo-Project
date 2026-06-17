import api from './client';
import type {
  WorkOrder,
  WorkOrderListResponse,
  DailyWorkOrdersResponse,
  WorkOrderCreate,
  WorkOrderAssign,
  WorkOrderComplete,
  WorkOrderReview,
  Communication,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderCategory,
} from '@/types';

export const getDailyWorkOrders = async (
  skip = 0,
  limit = 50
): Promise<DailyWorkOrdersResponse> => {
  const response = await api.get('/work-orders/daily', {
    params: { skip, limit },
  });
  return response.data;
};

export const getWorkOrders = async (params: {
  skip?: number;
  limit?: number;
  status?: WorkOrderStatus;
  category?: WorkOrderCategory;
  priority?: WorkOrderPriority;
  assigned_to?: number;
  keyword?: string;
}): Promise<WorkOrderListResponse> => {
  const response = await api.get('/work-orders', { params });
  return response.data;
};

export const getWorkOrder = async (id: number): Promise<WorkOrder> => {
  const response = await api.get(`/work-orders/${id}`);
  return response.data;
};

export const createWorkOrder = async (
  data: WorkOrderCreate
): Promise<WorkOrder> => {
  const response = await api.post('/work-orders', data);
  return response.data;
};

export const assignWorkOrder = async (
  id: number,
  data: WorkOrderAssign
): Promise<WorkOrder> => {
  const response = await api.post(`/work-orders/${id}/assign`, data);
  return response.data;
};

export const startWorkOrder = async (
  id: number,
  remark?: string
): Promise<WorkOrder> => {
  const response = await api.post(`/work-orders/${id}/start`, null, {
    params: { remark },
  });
  return response.data;
};

export const completeWorkOrder = async (
  id: number,
  data: WorkOrderComplete
): Promise<WorkOrder> => {
  const response = await api.post(`/work-orders/${id}/complete`, data);
  return response.data;
};

export const reviewWorkOrder = async (
  id: number,
  data: WorkOrderReview
): Promise<WorkOrder> => {
  const response = await api.post(`/work-orders/${id}/review`, data);
  return response.data;
};

export const getCommunications = async (
  orderId: number
): Promise<Communication[]> => {
  const response = await api.get(`/work-orders/${orderId}/communications`);
  return response.data;
};

export const addCommunication = async (
  orderId: number,
  content: string
): Promise<Communication> => {
  const response = await api.post(`/work-orders/${orderId}/communications`, {
    content,
  });
  return response.data;
};
