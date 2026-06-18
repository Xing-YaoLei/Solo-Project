import request from './request';
import type { StatisticsOverview } from '@/types';

export const statisticsApi = {
  getOverview(startDate?: string, endDate?: string): Promise<StatisticsOverview> {
    return request.get('/statistics/overview', {
      params: { startDate, endDate },
    });
  },

  getSourceDistribution(startDate?: string, endDate?: string) {
    return request.get('/statistics/source-distribution', {
      params: { startDate, endDate },
    });
  },

  getHandlerRanking(startDate?: string, endDate?: string) {
    return request.get('/statistics/handler-ranking', {
      params: { startDate, endDate },
    });
  },

  getConclusionDistribution(startDate?: string, endDate?: string) {
    return request.get('/statistics/conclusion-distribution', {
      params: { startDate, endDate },
    });
  },

  getMonthlyStatistics(year: number) {
    return request.get('/statistics/monthly', { params: { year } });
  },
};

export default statisticsApi;
