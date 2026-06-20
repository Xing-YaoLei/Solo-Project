import client from '../client';
import type { PipelineStatus, SyncLog, DateRange, PageResponse } from '@/types';

export interface PipelineParams extends Partial<DateRange> {
  source?: string;
  status?: 'success' | 'pending' | 'failed';
}

export const pipelineApi = {
  getStatus() {
    return client.get<PipelineStatus>('/pipeline/status');
  },

  getSyncLogs(params?: PipelineParams & { page?: number; pageSize?: number }) {
    return client.get<PageResponse<SyncLog>>('/pipeline/logs', { params });
  },

  triggerSync(source: string) {
    return client.post<SyncLog>('/pipeline/sync', { source });
  },
};

export default pipelineApi;
