import request from './request';
import type { PartsInfo, PartsShortageRecord } from '@/types';
import { mockParts, mockShortageList, mockInventoryWarning } from '@/mock/data';

const USE_MOCK = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const partsApi = {
  async getList(params?: { keyword?: string; pageIndex?: number; pageSize?: number }): Promise<PartsInfo[]> {
    if (USE_MOCK) {
      await delay(300);
      let result = [...mockParts];
      if (params?.keyword) {
        const lower = params.keyword.toLowerCase();
        result = result.filter(item =>
          item.name.toLowerCase().includes(lower) ||
          item.partNumber.toLowerCase().includes(lower)
        );
      }
      return result;
    }
    return request.get('/parts', { params });
  },

  async getById(id: number): Promise<PartsInfo | null> {
    if (USE_MOCK) {
      await delay(200);
      return mockParts.find(p => p.id === id) || null;
    }
    return request.get(`/parts/${id}`);
  },

  async getLowStock(): Promise<PartsInfo[]> {
    if (USE_MOCK) {
      await delay(200);
      return mockInventoryWarning;
    }
    return request.get('/parts/low-stock');
  },

  async getInventoryWarning(): Promise<PartsInfo[]> {
    if (USE_MOCK) {
      await delay(200);
      return mockInventoryWarning;
    }
    return request.get('/parts/low-stock');
  },

  async create(data: any): Promise<PartsInfo> {
    if (USE_MOCK) {
      await delay(300);
      const newPart: any = {
        ...data,
        id: Date.now(),
        isLowStock: data.stockQuantity < data.safetyStock,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockParts.push(newPart);
      return newPart;
    }
    return request.post('/parts', data);
  },

  async update(id: number, data: any): Promise<PartsInfo> {
    if (USE_MOCK) {
      await delay(200);
      const index = mockParts.findIndex(p => p.id === id);
      if (index > -1) {
        mockParts[index] = { ...mockParts[index], ...data };
        mockParts[index].isLowStock = mockParts[index].stockQuantity < mockParts[index].safetyStock;
        return mockParts[index];
      }
      throw new Error('Part not found');
    }
    return request.put(`/parts/${id}`, data);
  },

  async updateStock(id: number, quantity: number): Promise<PartsInfo> {
    if (USE_MOCK) {
      await delay(200);
      const part = mockParts.find(p => p.id === id);
      if (part) {
        part.stockQuantity += quantity;
        part.isLowStock = part.stockQuantity < part.safetyStock;
        return part;
      }
      throw new Error('Part not found');
    }
    return request.put(`/parts/${id}/stock`, { quantity });
  },

  async getShortageList(appointmentId?: number): Promise<PartsShortageRecord[]> {
    if (USE_MOCK) {
      await delay(200);
      if (appointmentId) {
        return mockShortageList.filter(s => s.appointmentId === appointmentId);
      }
      return mockShortageList;
    }
    return request.get('/parts/shortages', { params: { appointmentId } });
  },

  async createShortage(appointmentId: number, data: any): Promise<PartsShortageRecord> {
    if (USE_MOCK) {
      await delay(200);
      const newShortage: any = {
        id: Date.now(),
        appointmentId,
        appointmentNo: data.appointmentNo || '',
        partsId: data.partsId || 0,
        partName: data.partName,
        partCode: data.partCode,
        shortageQuantity: data.shortageQuantity,
        expectedArrivalTime: data.expectedArrivalTime,
        status: 'Pending',
        handler: data.handler || '当前用户',
        remarks: data.remarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockShortageList.unshift(newShortage);
      return newShortage;
    }
    return request.post('/parts/shortages', { ...data, appointmentId });
  },

  async resolveShortage(id: number): Promise<PartsShortageRecord> {
    if (USE_MOCK) {
      await delay(200);
      const shortage = mockShortageList.find(s => s.id === id);
      if (shortage) {
        shortage.status = 'Resolved';
        shortage.actualArrivalTime = new Date().toISOString();
        return shortage;
      }
      throw new Error('Shortage record not found');
    }
    return request.put(`/parts/shortages/${id}/resolve`);
  },
};

export default partsApi;
