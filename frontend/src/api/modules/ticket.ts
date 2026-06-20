import client from '../client';
import type { TicketRankItem, DateRange } from '@/types';

export interface TicketParams extends Partial<DateRange> {
  ticketType?: string;
}

export const ticketApi = {
  getRank(params?: TicketParams & { topN?: number }) {
    return client.get<TicketRankItem[]>('/ticket/rank', { params });
  },

  getSummary(params?: TicketParams) {
    return client.get<{
      totalSold: number;
      totalRevenue: number;
      avgPrice: number;
      byType: Record<string, { sold: number; revenue: number }>;
    }>('/ticket/summary', { params });
  },
};

export default ticketApi;
