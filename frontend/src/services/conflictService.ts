import api from './api';
import type { ConflictOfInterest } from '../types';
import { ConflictType, ConflictResolutionStatus } from '../types';

export const conflictService = {
  create: (data: { hearingId: string; conflictType: ConflictType; description: string }) =>
    api.post<ConflictOfInterest>('/conflicts', data).then(r => r.data),
  resolve: (id: string, data: { resolution: string; resolutionStatus: ConflictResolutionStatus; relatedAttachmentId?: string }) =>
    api.put(`/conflicts/${id}/resolve`, data).then(r => r.data),
  getById: (id: string) => api.get<ConflictOfInterest>(`/conflicts/${id}`).then(r => r.data),
  getByHearing: (hearingId: string) => api.get<ConflictOfInterest[]>(`/conflicts/hearing/${hearingId}`).then(r => r.data),
  getActive: () => api.get<ConflictOfInterest[]>('/conflicts/active').then(r => r.data),
};
