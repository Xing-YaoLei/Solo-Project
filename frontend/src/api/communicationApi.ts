import { AxiosResponse } from 'axios';
import api from './client';

export const communicationApi = {
  getLogs(params?: { stockAlertId?: string; quoteId?: string; workOrderId?: string }): Promise<AxiosResponse<any>> {
    return api.get('/communication-logs', { params });
  },

  createLog(data: any): Promise<AxiosResponse<any>> {
    return api.post('/communication-logs', data);
  },
};

export default communicationApi;
