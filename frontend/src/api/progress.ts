import api from './axios';
import type {
  Certificate,
  LearningProgress,
  LearningProgressDetail,
  ProgressHistory,
  PagedResult,
  ProgressStatus,
} from '../types';

export const certificateApi = {
  getAll: (isActive?: boolean) =>
    api.get<Certificate[]>('/certificates', { params: { isActive } }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Certificate>(`/certificates/${id}`).then((r) => r.data),
};

export const progressApi = {
  getList: (params: {
    userId?: number;
    certificateId?: number;
    courseId?: number;
    status?: ProgressStatus;
    pageIndex?: number;
    pageSize?: number;
  }) =>
    api.get<PagedResult<LearningProgress>>('/learningProgress', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<LearningProgress>(`/learningProgress/${id}`).then((r) => r.data),

  getDetail: (id: number) =>
    api.get<LearningProgressDetail>(`/learningProgress/${id}/detail`).then((r) => r.data),

  getHistory: (id: number) =>
    api.get<ProgressHistory[]>(`/learningProgress/${id}/history`).then((r) => r.data),

  getByUser: (userId: number, certificateId?: number) =>
    api.get<LearningProgress[]>(`/learningProgress/user/${userId}`, { params: { certificateId } }).then((r) => r.data),

  update: (id: number, data: {
    completionRate: number;
    status?: ProgressStatus;
    note?: string;
    changeReason?: string;
    changedByUserId: number;
  }) =>
    api.put<LearningProgress>(`/learningProgress/${id}`, data).then((r) => r.data),
};
