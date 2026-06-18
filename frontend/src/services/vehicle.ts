import request from './request';
import type { VehicleInfo } from '@/types';
import type { CreateVehiclePayload } from './appointment';

export const vehicleApi = {
  getList(params?: { keyword?: string }): Promise<VehicleInfo[]> {
    return request.get('/vehicles', { params });
  },

  getById(id: number): Promise<VehicleInfo> {
    return request.get(`/vehicles/${id}`);
  },

  getByPlateNumber(plateNumber: string): Promise<VehicleInfo> {
    return request.get(`/vehicles/by-plate/${encodeURIComponent(plateNumber)}`);
  },

  create(data: CreateVehiclePayload): Promise<VehicleInfo> {
    return request.post('/vehicles', data);
  },

  update(id: number, data: any): Promise<VehicleInfo> {
    return request.put(`/vehicles/${id}`, data);
  },

  remove(id: number): Promise<void> {
    return request.delete(`/vehicles/${id}`);
  },
};

export default vehicleApi;
