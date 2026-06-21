import api from './api';
import type { StatisticsOverview, ClientSatisfactionReport, HearingStatistics } from '../types';

export const statisticsService = {
  getOverview: (from?: string, to?: string) =>
    api.get<StatisticsOverview>('/statistics/overview', { params: { from, to } }).then(r => r.data),
  getClientSatisfaction: (from?: string, to?: string) =>
    api.get<ClientSatisfactionReport[]>('/statistics/client-satisfaction', { params: { from, to } }).then(r => r.data),
  getHearingStats: (from: string, to: string) =>
    api.get<HearingStatistics[]>('/statistics/hearing-stats', { params: { from, to } }).then(r => r.data),
  getClientSatisfactionDetail: (clientId: string) =>
    api.get<ClientSatisfactionReport>(`/statistics/client-satisfaction/${clientId}`).then(r => r.data),
};
