import { AxiosResponse } from 'axios';
import api from './client';

export const stockAlertApi = {
  getStockAlerts(acknowledged?: boolean): Promise<AxiosResponse<any>> {
    return api.get('/stockalerts', { params: { acknowledged } });
  },

  getStockAlertById(id: string): Promise<AxiosResponse<any>> {
    return api.get(`/stockalerts/${id}`);
  },

  acknowledgeAlert(id: string): Promise<AxiosResponse<any>> {
    return api.post(`/stockalerts/${id}/acknowledge`);
  },
};

export default stockAlertApi;
