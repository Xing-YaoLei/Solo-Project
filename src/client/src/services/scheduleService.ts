import api from './api';
import type {
  ScheduleListDto,
  ScheduleDetailDto,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleStatusChangeDto,
  ScheduleQueryDto,
  PagedResultDto,
} from '@/types';

export const scheduleService = {
  getList: (query?: ScheduleQueryDto): Promise<PagedResultDto<ScheduleListDto>> => {
    return api.get('/schedules', { params: query });
  },

  getById: (id: string): Promise<ScheduleDetailDto> => {
    return api.get(`/schedules/${id}`);
  },

  create: (dto: CreateScheduleDto): Promise<ScheduleDetailDto> => {
    return api.post('/schedules', dto);
  },

  update: (id: string, dto: UpdateScheduleDto): Promise<ScheduleDetailDto> => {
    return api.put(`/schedules/${id}`, dto);
  },

  delete: (id: string): Promise<void> => {
    return api.delete(`/schedules/${id}`);
  },

  submitForReview: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/submit`, dto);
  },

  approveReview: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/approve`, dto);
  },

  rejectReview: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/reject`, dto);
  },

  startProcessing: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/start`, dto);
  },

  completeProcessing: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/complete`, dto);
  },

  submitPostReview: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/postreview/submit`, dto);
  },

  completePostReview: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/postreview/complete`, dto);
  },

  closeSchedule: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/close`, dto);
  },

  changeStatus: (id: string, dto: ScheduleStatusChangeDto): Promise<ScheduleDetailDto> => {
    return api.post(`/schedules/${id}/status`, dto);
  },
};
