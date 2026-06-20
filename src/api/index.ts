import client from './client';
import type {
  KPIData,
  TrendDataPoint,
  TicketType,
  OrderData,
  SeatData,
  AreaData,
  VerificationData,
  CaliberVersion,
  RefundDispute,
  SampleDetail,
  SyncBatch,
  SyncTask,
  CheckInCodeCaliber,
  SponsorshipRight,
} from '@/types';

export async function getKPI() {
  return client.get<never, { data: KPIData[] }>('/dashboard/kpi');
}

export async function getTrend(params?: { start?: string; end?: string }) {
  return client.get<never, { data: TrendDataPoint[] }>('/dashboard/trend', { params });
}

export async function getYoyMom() {
  return client.get<never, { data: { yoy: TrendDataPoint[]; mom: TrendDataPoint[] } }>('/dashboard/yoy-mom');
}

export async function getTicketTypes() {
  return client.get<never, { data: TicketType[] }>('/ticket-types');
}

export async function getTicketType(id: string) {
  return client.get<never, { data: TicketType }>(`/ticket-types/${id}`);
}

export async function getOrderTrend(params?: { ticketTypeId?: string }) {
  return client.get<never, { data: TrendDataPoint[] }>('/orders/trend', { params });
}

export async function getOrderFunnel() {
  return client.get<never, { data: { stages: string[]; values: number[] } }>('/orders/funnel');
}

export async function getSeatLayout() {
  return client.get<never, { data: SeatData[] }>('/seat-map/layout');
}

export async function getAreas() {
  return client.get<never, { data: AreaData[] }>('/seat-map/areas');
}

export async function getSeatDetail(seatId: string) {
  return client.get<never, { data: SeatData }>(`/seat-map/seats/${seatId}`);
}

export async function getVerificationEfficiency(params?: { caliber?: string }) {
  return client.get<never, { data: VerificationData[] }>('/verification/efficiency', { params });
}

export async function getCalibers() {
  return client.get<never, { data: CaliberVersion[] }>('/verification/calibers');
}

export async function getRefundDisputes(params?: { status?: string; page?: number; pageSize?: number }) {
  return client.get<never, { data: { items: RefundDispute[]; total: number } }>('/refund-disputes', { params });
}

export async function getRefundDispute(disputeId: string) {
  return client.get<never, { data: RefundDispute }>(`/refund-disputes/${disputeId}`);
}

export async function getSampleDetail(disputeId: string) {
  return client.get<never, { data: SampleDetail }>(`/refund-disputes/${disputeId}/sample`);
}

export async function getSyncBatches(params?: { source?: string; status?: string }) {
  return client.get<never, { data: SyncBatch[] }>('/sync/batches', { params });
}

export async function rerunBatch(batchId: string) {
  return client.post<never, { data: SyncBatch }>(`/sync/batches/${batchId}/rerun`);
}

export async function getSyncTasks() {
  return client.get<never, { data: SyncTask[] }>('/sync/tasks');
}

export async function triggerSyncTask(taskId: string) {
  return client.post<never, { data: SyncTask }>(`/sync/tasks/${taskId}/trigger`);
}

export async function getTopology() {
  return client.get<never, { data: { nodes: { id: string; name: string; type: string }[]; edges: { source: string; target: string }[] } }>('/sync/topology');
}

export async function getCheckinCodeCaliber() {
  return client.get<never, { data: CheckInCodeCaliber[] }>('/checkin-code/caliber');
}

export async function getSponsorshipRights() {
  return client.get<never, { data: SponsorshipRight[] }>('/dashboard/sponsorship-rights');
}
