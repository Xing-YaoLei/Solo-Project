import { AxiosResponse } from 'axios';
import api from './client';

export const workOrderApi = {
  getWorkOrders(params?: { date?: string; userId?: string }): Promise<AxiosResponse<any>> {
    return api.get('/workorders', { params });
  },

  getDailySchedule(date?: string): Promise<AxiosResponse<any>> {
    return api.get('/workorders/daily', { params: { date } });
  },

  getWorkOrderById(id: string): Promise<AxiosResponse<any>> {
    return api.get(`/workorders/${id}`);
  },

  createWorkOrder(data: any): Promise<AxiosResponse<any>> {
    return api.post('/workorders', data);
  },

  updateWorkOrder(id: string, data: any): Promise<AxiosResponse<any>> {
    return api.put(`/workorders/${id}`, data);
  },

  updateWorkOrderStatus(id: string, status: string): Promise<AxiosResponse<any>> {
    return api.put(`/workorders/${id}/status`, { status });
  },

  deleteWorkOrder(id: string): Promise<AxiosResponse<any>> {
    return api.delete(`/workorders/${id}`);
  },
};

export default workOrderApi;
