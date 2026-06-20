import client from '../client';
import type {
  RefundDistributionPoint,
  RefundSample,
  RefundSummary,
  DateRange,
  PageResponse,
} from '@/types';

export interface RefundParams extends Partial<DateRange> {
  status?: string;
  reason?: string;
  isDisputed?: boolean;
}

export const refundApi = {
  getDistribution(params?: RefundParams & { startDate?: string; endDate?: string }) {
    return client.get<RefundDistributionPoint[]>('/refund/distribution', { params });
  },

  getSampleById(id: string) {
    return client.get<RefundSample>(`/refund/${id}/sample`);
  },

  markProcessed(id: string, note?: string) {
    return client.post<RefundSample>(`/refund/${id}/mark-processed`, { note });
  },

  getSummary(params?: RefundParams) {
    return client.get<RefundSummary>('/refund/summary', { params });
  },
};

export default refundApi;
