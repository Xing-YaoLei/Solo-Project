import request from './request';
import type { StatisticsOverview } from '@/types';
import { mockStatistics } from '@/mock/data';

const USE_MOCK = true;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const statisticsApi = {
  async getOverview(startDate?: string, endDate?: string): Promise<StatisticsOverview> {
    if (USE_MOCK) {
      await delay(300);
      return mockStatistics;
    }
    return request.get('/statistics/overview', {
      params: { startDate, endDate },
    });
  },

  async getSourceDistribution(startDate?: string, endDate?: string) {
    if (USE_MOCK) {
      await delay(200);
      return mockStatistics.sourceDistribution;
    }
    return request.get('/statistics/source-distribution', {
      params: { startDate, endDate },
    });
  },

  async getHandlerRanking(startDate?: string, endDate?: string) {
    if (USE_MOCK) {
      await delay(200);
      return mockStatistics.handlerRanking;
    }
    return request.get('/statistics/handler-ranking', {
      params: { startDate, endDate },
    });
  },

  async getConclusionDistribution(startDate?: string, endDate?: string) {
    if (USE_MOCK) {
      await delay(200);
      return mockStatistics.conclusionDistribution;
    }
    return request.get('/statistics/conclusion-distribution', {
      params: { startDate, endDate },
    });
  },

  async getMonthlyStatistics(year: number) {
    if (USE_MOCK) {
      await delay(200);
      return [];
    }
    return request.get('/statistics/monthly', { params: { year } });
  },
};

export default statisticsApi;
