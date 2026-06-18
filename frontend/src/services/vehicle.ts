import request from './request';
import type { VehicleInfo } from '@/types';
import { mockVehicles } from '@/mock/data';

const USE_MOCK = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const vehicleApi = {
  async getList(params?: { keyword?: string; pageIndex?: number; pageSize?: number }): Promise<VehicleInfo[]> {
    if (USE_MOCK) {
      await delay(300);
      let result = [...mockVehicles];
      if (params?.keyword) {
        const lower = params.keyword.toLowerCase();
        result = result.filter(item =>
          item.plateNumber.toLowerCase().includes(lower) ||
          item.ownerName.includes(params.keyword!) ||
          item.vinNumber.toLowerCase().includes(lower) ||
          item.brand.includes(params.keyword!)
        );
      }
      return result;
    }
    return request.get('/vehicles', { params });
  },

  async getById(id: number): Promise<VehicleInfo | null> {
    if (USE_MOCK) {
      await delay(200);
      return mockVehicles.find(v => v.id === id) || null;
    }
    return request.get(`/vehicles/${id}`);
  },

  async getByPlateNumber(plateNumber: string): Promise<VehicleInfo | null> {
    if (USE_MOCK) {
      await delay(200);
      return mockVehicles.find(v => v.plateNumber === plateNumber) || null;
    }
    return request.get('/vehicles/by-plate', { params: { plateNumber } });
  },

  async create(data: any): Promise<VehicleInfo> {
    if (USE_MOCK) {
      await delay(300);
      const newVehicle: any = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockVehicles.push(newVehicle);
      return newVehicle;
    }
    return request.post('/vehicles', data);
  },

  async update(id: number, data: any): Promise<VehicleInfo> {
    if (USE_MOCK) {
      await delay(200);
      const index = mockVehicles.findIndex(v => v.id === id);
      if (index > -1) {
        mockVehicles[index] = { ...mockVehicles[index], ...data };
        mockVehicles[index].updatedAt = new Date().toISOString();
        return mockVehicles[index];
      }
      throw new Error('Vehicle not found');
    }
    return request.put(`/vehicles/${id}`, data);
  },
};

export default vehicleApi;
