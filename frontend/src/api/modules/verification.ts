import client from '../client';
import type {
  VerificationEfficiency,
  VerificationDatePoint,
  VerificationAreaItem,
  VerificationDefinition,
  DateRange,
} from '@/types';

export interface VerificationParams extends Partial<DateRange> {
  group?: string;
  areaCode?: string;
}

export const verificationApi = {
  getEfficiency(params?: VerificationParams) {
    return client.get<VerificationEfficiency[]>('/verification/efficiency', { params });
  },

  getDateTrend(params?: VerificationParams & { startDate?: string; endDate?: string }) {
    return client.get<VerificationDatePoint[]>('/verification/date-trend', { params });
  },

  getAreaCompare() {
    return client.get<VerificationAreaItem[]>('/verification/area-compare');
  },

  getDefinition() {
    return client.get<VerificationDefinition[]>('/verification/definition');
  },
};

export default verificationApi;
