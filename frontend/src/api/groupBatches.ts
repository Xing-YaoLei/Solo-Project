import client from './client';
import type { ApiResponse, GroupBatch, StatusChangeLog } from '../types';

export const getGroupBatches = () =>
  client.get<ApiResponse<GroupBatch[]>>('/group-batches');

export const getGroupBatch = (id: number) =>
  client.get<ApiResponse<GroupBatch>>(`/group-batches/${id}`);

export const createGroupBatch = (data: Partial<GroupBatch>) =>
  client.post<ApiResponse<GroupBatch>>('/group-batches', data);

export const openBatch = (id: number) =>
  client.post<ApiResponse<GroupBatch>>(`/group-batches/${id}/open`);

export const closeBatch = (id: number) =>
  client.post<ApiResponse<GroupBatch>>(`/group-batches/${id}/close`);

export const deliverBatch = (id: number) =>
  client.post<ApiResponse<GroupBatch>>(`/group-batches/${id}/deliver`);

export const getBatchStatusHistory = (id: number) =>
  client.get<ApiResponse<StatusChangeLog[]>>(`/group-batches/${id}/status-history`);
