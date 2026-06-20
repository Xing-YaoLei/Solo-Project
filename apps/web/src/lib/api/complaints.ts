import axiosInstance from '../axios';
import type { Complaint, ComplaintListQuery, PaginatedResponse, Priority, ComplaintSource } from '@scenic/shared';

export async function getComplaints(
  params?: ComplaintListQuery
): Promise<PaginatedResponse<Complaint>> {
  return axiosInstance.get('/api/complaints', { params });
}

export async function getComplaintById(id: string): Promise<Complaint> {
  return axiosInstance.get(`/api/complaints/${id}`);
}

export async function createComplaint(data: {
  title: string;
  content: string;
  source: ComplaintSource;
  priority?: Priority;
  visitorName: string;
  visitorPhone: string;
  visitorIdCard?: string;
  ticketNo?: string;
  location?: string;
  deadlineAt: string;
  tagIds?: string[];
}): Promise<Complaint> {
  return axiosInstance.post('/api/complaints', data);
}

export async function updateComplaint(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    priority: Priority;
    deadlineAt: string;
    tagIds: string[];
  }>
): Promise<Complaint> {
  return axiosInstance.put(`/api/complaints/${id}`, data);
}

export async function assignComplaint(
  id: string,
  data: { toUserId: string; departmentId?: string; reason?: string }
): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/assign`, data);
}

export async function reassignComplaint(
  id: string,
  data: { toUserId: string; departmentId?: string; reason?: string }
): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/reassign`, data);
}

export async function upgradeComplaint(
  id: string,
  data: { toLevel: Priority; reason: string }
): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/upgrade`, data);
}

export async function submitVisitResult(
  id: string,
  data: {
    satisfaction: 1 | 2 | 3 | 4 | 5;
    feedback: string;
    needFollowUp: boolean;
    visitedAt: string;
  }
): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/visit`, data);
}

export async function closeComplaint(id: string): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/close`);
}

export async function rejectComplaint(
  id: string,
  data: { reason: string }
): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/reject`, data);
}

export async function supplementComplaint(
  id: string,
  data: { content: string }
): Promise<Complaint> {
  return axiosInstance.post(`/api/complaints/${id}/supplement`, data);
}

export async function updateComplaintDeadline(
  id: string,
  data: { deadlineAt: string }
): Promise<Complaint> {
  return axiosInstance.put(`/api/complaints/${id}`, data);
}
