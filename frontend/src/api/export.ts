import client from './client';
import type { ApiResponse } from '../types';

export const exportSettlementSheet = (id: number) =>
  client.get(`/settlement-sheets/${id}/export`, { responseType: 'blob' });

export const exportArrivalList = (id: number) =>
  client.get(`/arrival-lists/${id}/export`, { responseType: 'blob' });

export const exportExceptionOrders = (ids: number[]) =>
  client.post('/exception-orders/export', { ids }, { responseType: 'blob' });

export const getCaliberDescription = (type: string) =>
  client.get<ApiResponse<string>>(`/export/caliber-description/${type}`);

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export { downloadBlob };
