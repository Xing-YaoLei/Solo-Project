import apiClient from './axios';
import type {
  SamplingRecord,
  SamplingStatus,
  PaginationParams,
  PaginatedResult,
  SamplingMethod,
} from './types';

export interface CreateSamplingRequest {
  title: string;
  taskId: string;
  method: SamplingMethod;
  population: number;
  sampleSize: number;
  confidenceLevel?: number;
  remark?: string;
  samples?: {
    itemNo: string;
    documentNo?: string;
    description?: string;
    amount?: number;
  }[];
}

export interface UpdateSamplingRequest {
  title?: string;
  method?: SamplingMethod;
  population?: number;
  sampleSize?: number;
  confidenceLevel?: number;
  status?: SamplingStatus;
  remark?: string;
  samples?: {
    id?: string;
    itemNo?: string;
    documentNo?: string;
    description?: string;
    amount?: number;
    isDefect?: boolean;
    defectType?: string;
    defectLevel?: string;
    remark?: string;
    evidenceId?: string;
  }[];
}

export interface SamplingFilters {
  status?: SamplingStatus;
  taskId?: string;
  createdById?: string;
}

export const samplingsApi = {
  getSamplings: async (
    params: PaginationParams & SamplingFilters = {},
  ): Promise<PaginatedResult<SamplingRecord>> => {
    const { data } = await apiClient.get('/samplings', { params });
    return data;
  },

  getSampling: async (id: string): Promise<SamplingRecord> => {
    const { data } = await apiClient.get(`/samplings/${id}`);
    return data;
  },

  createSampling: async (
    data: CreateSamplingRequest,
  ): Promise<SamplingRecord> => {
    const res = await apiClient.post('/samplings', data);
    return res.data;
  },

  updateSampling: async (
    id: string,
    data: UpdateSamplingRequest,
  ): Promise<SamplingRecord> => {
    const res = await apiClient.patch(`/samplings/${id}`, data);
    return res.data;
  },

  deleteSampling: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/samplings/${id}`);
    return data;
  },

  approveSampling: async (id: string): Promise<SamplingRecord> => {
    const { data } = await apiClient.post(`/samplings/${id}/approve`);
    return data;
  },

  rejectSampling: async (id: string): Promise<SamplingRecord> => {
    const { data } = await apiClient.post(`/samplings/${id}/reject`);
    return data;
  },
};
