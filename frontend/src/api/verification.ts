import axios from 'axios';
import type {
  VerificationRecord,
  VerificationRecordQuery,
  PagedResult,
  ConfirmationDto,
  SupplementDto,
  CloseDto,
  DamageReportDto,
  ResponsibilityAdjustmentDto,
  ReviewDto,
  Rider,
  RiderActivity,
  DamageReport,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export async function fetchVerificationRecords(
  params?: VerificationRecordQuery
): Promise<PagedResult<VerificationRecord>> {
  const res = await api.get('/verification-records', { params });
  return res.data;
}

export async function fetchVerificationRecordById(
  id: string
): Promise<VerificationRecord> {
  const res = await api.get(`/verification-records/${id}`);
  return res.data;
}

export async function confirmRecord(
  id: string,
  dto: ConfirmationDto
): Promise<VerificationRecord> {
  const res = await api.post(`/verification-records/${id}/confirm`, dto);
  return res.data;
}

export async function supplementRecord(
  id: string,
  dto: SupplementDto
): Promise<VerificationRecord> {
  const formData = new FormData();
  if (dto.remark) formData.append('Remark', dto.remark);
  if (dto.ratingTags?.length) {
    dto.ratingTags.forEach((tag) => formData.append('RatingTags', tag));
  }
  if (dto.files?.length) {
    dto.files.forEach((file) => formData.append('Files', file));
  }
  const res = await api.post(`/verification-records/${id}/supplement`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function closeRecord(
  id: string,
  dto: CloseDto
): Promise<VerificationRecord> {
  const res = await api.post(`/verification-records/${id}/close`, dto);
  return res.data;
}

export async function reportDamage(
  id: string,
  dto: DamageReportDto
): Promise<VerificationRecord> {
  const res = await api.post(`/verification-records/${id}/report-damage`, dto);
  return res.data;
}

export async function adjustResponsibility(
  id: string,
  dto: ResponsibilityAdjustmentDto
): Promise<VerificationRecord> {
  const res = await api.post(
    `/verification-records/${id}/adjust-responsibility`,
    dto
  );
  return res.data;
}

export async function completeReview(
  id: string,
  dto: ReviewDto
): Promise<VerificationRecord> {
  const res = await api.post(`/verification-records/${id}/reviews`, dto);
  return res.data;
}

export async function adjustDamageResponsibility(
  recordId: string,
  reportId: string,
  dto: ResponsibilityAdjustmentDto
): Promise<DamageReport> {
  const res = await api.put(
    `/verification-records/${recordId}/damage-reports/${reportId}/responsibility`,
    dto
  );
  return res.data;
}

export async function fetchRiders(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Rider[]> {
  const res = await api.get('/riders', { params });
  return res.data;
}

export async function fetchRiderActivity(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<RiderActivity[]> {
  const res = await api.get('/riders/activity', { params });
  return res.data;
}
