import client from '../client';
import type { KPIOverview, KPITrendPoint, DateRange } from '@/types';

export interface KPIParams extends Partial<DateRange> {
  compareMode?: 'none' | 'yoy' | 'mom';
}

export const kpiApi = {
  getOverview(params?: KPIParams) {
    return client.get<KPIOverview>('/kpi/overview', { params });
  },

  getTrend(params?: KPIParams & { granularity?: 'day' | 'hour' }) {
    return client.get<KPITrendPoint[]>('/kpi/trend', { params });
  },
};

export default kpiApi;
