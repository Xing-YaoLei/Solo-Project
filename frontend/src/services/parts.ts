import request from './request';
import type { PartsInfo, PartsShortageRecord } from '@/types';

export interface CreateShortagePayload {
  appointmentId: number;
  partsId: number;
  shortageQuantity: number;
  expectedArrivalTime?: string;
  handler?: string;
  remarks?: string;
}

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

  addStock(id: number, quantity: number): Promise<PartsInfo> {
    return request.put(`/parts/${id}/add-stock`, { quantity });
  },

  reduceStock(id: number, quantity: number): Promise<PartsInfo> {
    return request.put(`/parts/${id}/reduce-stock`, { quantity });
  },

  getShortageList(appointmentId?: number): Promise<PartsShortageRecord[]> {
    if (appointmentId != null) {
      return request.get(`/appointments/${appointmentId}/parts-shortage`);
    }
    return request.get('/parts/shortage-records');
  },

  createShortage(payload: CreateShortagePayload): Promise<PartsShortageRecord> {
    return request.post('/parts/shortage-records', payload);
  },

  resolveShortage(id: number): Promise<PartsShortageRecord> {
    return request.put(`/parts/shortage-records/${id}/resolve`);
  },
};

export default partsApi;
