import api from './api';
import type { Attachment } from '../types';
import { AttachmentType } from '../types';

export const attachmentService = {
  upload: (hearingId: string, file: File, attachmentType: AttachmentType, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachmentType', String(attachmentType));
    if (description) formData.append('description', description);
    return api.post<Attachment>(`/hearings/${hearingId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  download: (attachmentId: string) => api.get(`/hearings/attachments/${attachmentId}/download`, { responseType: 'blob' }),
  delete: (attachmentId: string) => api.delete(`/hearings/attachments/${attachmentId}`),
  getByHearing: (hearingId: string) => api.get<Attachment[]>(`/hearings/${hearingId}/attachments`).then(r => r.data),
};
