import client from './client';
import type { ApiResponse, LeaderTier } from '../types';

export const getLeaderTiers = () =>
  client.get<ApiResponse<LeaderTier[]>>('/leader-tiers');

export const getLeaderTier = (id: number) =>
  client.get<ApiResponse<LeaderTier>>(`/leader-tiers/${id}`);

export const createLeaderTier = (data: Partial<LeaderTier>) =>
  client.post<ApiResponse<LeaderTier>>('/leader-tiers', data);

export const updateLeaderTier = (id: number, data: Partial<LeaderTier>) =>
  client.put<ApiResponse<LeaderTier>>(`/leader-tiers/${id}`, data);

export const deleteLeaderTier = (id: number) =>
  client.delete<ApiResponse<void>>(`/leader-tiers/${id}`);
