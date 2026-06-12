import client from './client';
import type { ApiResponse, ExceptionOrder, ExceptionType, ExceptionSeverity, ExceptionResolution } from '../types';

interface ExceptionOrderFilters {
  exceptionType?: ExceptionType;
  severity?: ExceptionSeverity;
  resolution?: ExceptionResolution;
}

export const getExceptionOrders = (filters?: ExceptionOrderFilters) =>
  client.get<ApiResponse<ExceptionOrder[]>>('/exception-orders', { params: filters });

export const getExceptionOrder = (id: number) =>
  client.get<ApiResponse<ExceptionOrder>>(`/exception-orders/${id}`);

export const createExceptionOrder = (data: Partial<ExceptionOrder>) =>
  client.post<ApiResponse<ExceptionOrder>>('/exception-orders', data);

export const resolveExceptionOrder = (id: number, data: Partial<ExceptionOrder>) =>
  client.post<ApiResponse<ExceptionOrder>>(`/exception-orders/${id}/resolve`, data);
