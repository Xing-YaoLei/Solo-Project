import apiClient from './axios';
import type {
  Evidence,
  EvidenceStatus,
  EvidenceCategory,
  PaginationParams,
  PaginatedResult,
  Attachment,
  EvidenceSupplement,
} from './types';

export interface EvidenceFilters {
  status?: EvidenceStatus;
  category?: EvidenceCategory;
  taskId?: string;
  submittedById?: string;
}

export interface CreateEvidenceRequest {
  title: string;
  description?: string;
  category: EvidenceCategory;
  taskId: string;
  relatedDocumentNo?: string;
  relatedDocumentType?: string;
  relatedDocumentDate?: string;
  relatedDocumentAmount?: number;
}

export interface UpdateEvidenceRequest {
  title?: string;
  description?: string;
  category?: EvidenceCategory;
  relatedDocumentNo?: string;
  relatedDocumentType?: string;
  relatedDocumentDate?: string;
  relatedDocumentAmount?: number;
}

export interface UploadAttachmentRequest {
  evidenceId: string;
  description?: string;
  isSupplement?: boolean;
}

export interface SupplementRequest {
  evidenceId: string;
  reason: string;
}

export const evidencesApi = {
  getEvidences: async (
    params: PaginationParams & EvidenceFilters = {},
  ): Promise<PaginatedResult<Evidence>> => {
    const { data } = await apiClient.get('/evidences', { params });
    return data;
  },

  getEvidence: async (id: string): Promise<Evidence> => {
    const { data } = await apiClient.get(`/evidences/${id}`);
    return data;
  },

  createEvidence: async (data: CreateEvidenceRequest): Promise<Evidence> => {
    const res = await apiClient.post('/evidences', data);
    return res.data;
  },

  updateEvidence: async (
    id: string,
    data: UpdateEvidenceRequest,
  ): Promise<Evidence> => {
    const res = await apiClient.patch(`/evidences/${id}`, data);
    return res.data;
  },

  deleteEvidence: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete(`/evidences/${id}`);
    return data;
  },

  submitEvidence: async (id: string): Promise<Evidence> => {
    const { data } = await apiClient.post(`/evidences/${id}/submit`);
    return data;
  },

  uploadAttachment: async (
    file: File,
    uploadData: UploadAttachmentRequest,
  ): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('evidenceId', uploadData.evidenceId);
    if (uploadData.description) {
      formData.append('description', uploadData.description);
    }
    if (uploadData.isSupplement) {
      formData.append('isSupplement', String(uploadData.isSupplement));
    }
    const { data } = await apiClient.post('/evidences/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  requestSupplement: async (
    data: SupplementRequest,
  ): Promise<EvidenceSupplement> => {
    const res = await apiClient.post('/evidences/supplement/request', data);
    return res.data;
  },

  completeSupplement: async (
    supplementId: string,
  ): Promise<EvidenceSupplement> => {
    const { data } = await apiClient.post(
      `/evidences/supplement/${supplementId}/complete`,
    );
    return data;
  },
};
