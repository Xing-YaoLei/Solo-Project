import client from './client';
import type { ApiResponse, ArrivalList } from '../types';

export const getArrivalLists = () =>
  client.get<ApiResponse<ArrivalList[]>>('/arrival-lists');

export const getArrivalList = (id: number) =>
  client.get<ApiResponse<ArrivalList>>(`/arrival-lists/${id}`);

export const createArrivalList = (data: Partial<ArrivalList>) =>
  client.post<ApiResponse<ArrivalList>>('/arrival-lists', data);

export const inspectArrivalList = (id: number, data?: Partial<ArrivalList>) =>
  client.post<ApiResponse<ArrivalList>>(`/arrival-lists/${id}/inspect`, data);

export const pickupArrivalList = (id: number, data: { itemId: number; pickupStatus: string }) =>
  client.post<ApiResponse<ArrivalList>>(`/arrival-lists/${id}/pickup`, data);
