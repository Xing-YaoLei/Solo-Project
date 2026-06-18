import request from './request';
import type { PartsInfo, PartsShortageRecord } from '@/types';

export const partsApi = {
  getList(params?: { keyword?: string }): Promise<PartsInfo[]> {
    return request.get('/parts', { params });
  },

  getById(id: number): Promise<PartsInfo> {
    return request.get(`/parts/${id}`);
  },

  getLowStock(): Promise<PartsInfo[]> {
    return request.get('/parts/low-stock');
  },

  getInventoryWarning(): Promise<PartsInfo[]> {
    return request.get('/parts/low-stock');
  },

  create(data: any): Promise<PartsInfo> {
    return request.post('/parts', data);
  },

  update(id: number, data: any): Promise<PartsInfo> {
    return request.put(`/parts/${id}`, data);
  },

  updateStock(id: number, quantity: number): Promise<PartsInfo> {
    return request.put(`/parts/${id}/stock`, { quantity });
  },

  getShortageList(appointmentId?: number): Promise<PartsShortageRecord[]> {
    if (appointmentId != null) {
      return request.get(`/appointments/${appointmentId}/parts-shortage`);
    }
    return request.get('/parts/shortages');
  },

  createShortage(appointmentId: number, data: any): Promise<PartsShortageRecord> {
    return request.post(`/appointments/${appointmentId}/parts-shortage`, data);
  },

  resolveShortage(appointmentId: number, id: number): Promise<PartsShortageRecord> {
    return request.put(`/appointments/${appointmentId}/parts-shortage/${id}/resolve`);
  },
};

export default partsApi;
