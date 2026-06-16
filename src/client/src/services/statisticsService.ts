import api from './api';
import type {
  StatisticsDto,
  ScheduleStatisticsDto,
  ExceptionStatisticsDto,
  CareStandardStatisticsDto,
  SourceStatisticsDto,
  HandlerStatisticsDto,
  ExceptionCauseStatisticsDto,
  StatisticsQueryDto,
} from '@/types';

export const statisticsService = {
  getOverview: (query?: StatisticsQueryDto): Promise<StatisticsDto> => {
    return api.get('/statistics/overview', { params: query });
  },

  getScheduleStatistics: (query?: StatisticsQueryDto): Promise<ScheduleStatisticsDto> => {
    return api.get('/statistics/schedules', { params: query });
  },

  getExceptionStatistics: (query?: StatisticsQueryDto): Promise<ExceptionStatisticsDto> => {
    return api.get('/statistics/exceptions', { params: query });
  },

  getCareStandardStatistics: (query?: StatisticsQueryDto): Promise<CareStandardStatisticsDto> => {
    return api.get('/statistics/carestandards', { params: query });
  },

  getSourceStatistics: (query?: StatisticsQueryDto): Promise<SourceStatisticsDto> => {
    return api.get('/statistics/sources', { params: query });
  },

  getHandlerStatistics: (query?: StatisticsQueryDto): Promise<HandlerStatisticsDto> => {
    return api.get('/statistics/handlers', { params: query });
  },

  getExceptionCauseStatistics: (query?: StatisticsQueryDto): Promise<ExceptionCauseStatisticsDto> => {
    return api.get('/statistics/exceptioncauses', { params: query });
  },
};
