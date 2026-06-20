import axiosInstance from '../axios';
import type { CloseDurationStats, DateTrendStats, OwnerDrillStats } from '@scenic/shared';

export async function getCloseDurationStats(): Promise<CloseDurationStats[]> {
  return axiosInstance.get('/api/reports/close-duration');
}

export async function getDateTrendStats(
  params?: { dateFrom?: string; dateTo?: string }
): Promise<DateTrendStats[]> {
  return axiosInstance.get('/api/reports/date-trend', { params });
}

export async function getOwnerDrillStats(): Promise<OwnerDrillStats[]> {
  return axiosInstance.get('/api/reports/owner-drill');
}
