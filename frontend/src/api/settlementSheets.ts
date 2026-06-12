import client from './client';
import type { ApiResponse, SettlementSheet } from '../types';

export const getSettlementSheets = () =>
  client.get<ApiResponse<SettlementSheet[]>>('/settlement-sheets');

export const getSettlementSheet = (id: number) =>
  client.get<ApiResponse<SettlementSheet>>(`/settlement-sheets/${id}`);

export const createSettlementSheet = (data: Partial<SettlementSheet>) =>
  client.post<ApiResponse<SettlementSheet>>('/settlement-sheets', data);

export const confirmSettlement = (id: number) =>
  client.post<ApiResponse<SettlementSheet>>(`/settlement-sheets/${id}/confirm`);

export const settleSettlement = (id: number) =>
  client.post<ApiResponse<SettlementSheet>>(`/settlement-sheets/${id}/settle`);
