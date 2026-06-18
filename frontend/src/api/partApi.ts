import { AxiosResponse } from 'axios';
import api from './client';

export const partApi = {
  getParts(params?: { category?: string; lowStockOnly?: boolean }): Promise<AxiosResponse<any>> {
    return api.get('/parts', { params });
  },

  getPartById(id: string): Promise<AxiosResponse<any>> {
    return api.get(`/parts/${id}`);
  },

  createPart(data: any): Promise<AxiosResponse<any>> {
    return api.post('/parts', data);
  },

  updatePart(id: string, data: any): Promise<AxiosResponse<any>> {
    return api.put(`/parts/${id}`, data);
  },

  deletePart(id: string): Promise<AxiosResponse<any>> {
    return api.delete(`/parts/${id}`);
  },
};

export default partApi;
