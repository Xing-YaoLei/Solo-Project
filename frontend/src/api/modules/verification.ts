import client from '../client';
import type {
  VerificationEfficiency,
  VerificationDatePoint,
  VerificationAreaItem,
  VerificationDefinitionRule,
  DateRange,
} from '@/types';

export interface VerificationParams extends Partial<DateRange> {
  areaCode?: string;
  definitionId?: string;
}

export const verificationApi = {
  getEfficiency(params?: VerificationParams) {
    return client.get<VerificationEfficiency[]>('/verification/efficiency', { params });
  },

  getDateTrend(params?: VerificationParams) {
    return client.get<VerificationDatePoint[]>('/verification/date-trend', { params });
  },

  getAreas(params?: VerificationParams) {
    return client.get<VerificationAreaItem[]>('/verification/areas', { params });
  },

  getDefinitions() {
    return client.get<VerificationDefinitionRule[]>('/verification/definitions');
  },
};

export default verificationApi;
