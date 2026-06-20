import client from '../client';
import type { SeatHeatmapItem, CheckinTrendPoint, DateRange } from '@/types';

export interface SeatmapParams extends Partial<DateRange> {
  section?: string;
}

export const seatmapApi = {
  getHeatmap(params?: SeatmapParams) {
    return client.get<SeatHeatmapItem[]>('/seatmap/heatmap', { params });
  },

  getCheckinTrend(params?: SeatmapParams & { granularity?: 'hour' | 'day' }) {
    return client.get<CheckinTrendPoint[]>('/seatmap/checkin-trend', { params });
  },
};

export default seatmapApi;
