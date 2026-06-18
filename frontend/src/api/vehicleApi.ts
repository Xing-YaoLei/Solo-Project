import { AxiosResponse } from 'axios';
import api from './client';

export const vehicleApi = {
  getAllVehicles(): Promise<AxiosResponse<any>> {
    return api.get('/vehicles');
  },

  getVehicleById(id: string): Promise<AxiosResponse<any>> {
    return api.get(`/vehicles/${id}`);
  },

  getVehicleByPlate(plate: string): Promise<AxiosResponse<any>> {
    return api.get(`/vehicles/plate/${plate}`);
  },

  createVehicle(data: any): Promise<AxiosResponse<any>> {
    return api.post('/vehicles', data);
  },

  updateVehicle(id: string, data: any): Promise<AxiosResponse<any>> {
    return api.put(`/vehicles/${id}`, data);
  },

  deleteVehicle(id: string): Promise<AxiosResponse<any>> {
    return api.delete(`/vehicles/${id}`);
  },
};

export default vehicleApi;
