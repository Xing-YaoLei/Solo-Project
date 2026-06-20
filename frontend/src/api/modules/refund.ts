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
  getDistribution(params?: RefundParams) {
    return client.get<RefundDistributionPoint[]>('/refund/distribution', { params });
  },

  getSamples(params?: RefundParams & { page?: number; pageSize?: number }) {
    return client.get<PageResponse<RefundSample>>('/refund/samples', { params });
  },

  getSummary(params?: RefundParams) {
    return client.get<RefundSummary>('/refund/summary', { params });
  },

  getSampleById(id: string) {
    return client.get<RefundSample>(`/refund/samples/${id}`);
  },

  markProcessed(id: string, note?: string) {
    return client.post<RefundSample>(`/refund/${id}/mark-processed`, { note });
  },
};

export default refundApi;
