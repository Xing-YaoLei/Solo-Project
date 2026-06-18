import { AxiosResponse } from 'axios';
import api from './client';

export const dashboardApi = {
  getStats(): Promise<AxiosResponse<any>> {
    return api.get('/dashboard/stats');
  },

  getReworkTrend(months?: number): Promise<AxiosResponse<any>> {
    return api.get('/dashboard/rework-trend', { params: { months } });
  },
};

export default dashboardApi;
