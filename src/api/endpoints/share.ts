import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client';
import type {
  ShareLinkCreate,
  ShareLinkUpdate,
  ShareLink,
  ShareLinkListItem,
  ShareAccessRequest,
  ShareAccessResponse,
  PaginationParams,
  PaginationResponse,
} from '@/types';

export const shareApi = {
  createShareLink: async (data: ShareLinkCreate): Promise<ShareLink> => {
    return apiPost<ShareLink>('/shares', data);
  },

  getShareLinks: async (
    params?: PaginationParams
  ): Promise<PaginationResponse<ShareLinkListItem>> => {
    return apiGet<PaginationResponse<ShareLinkListItem>>('/shares', { params });
  },

  getShareLink: async (id: string): Promise<ShareLink> => {
    return apiGet<ShareLink>(`/shares/${id}`);
  },

  updateShareLink: async (id: string, data: ShareLinkUpdate): Promise<ShareLink> => {
    return apiPut<ShareLink>(`/shares/${id}`, data);
  },

  deleteShareLink: async (id: string): Promise<void> => {
    return apiDelete<void>(`/shares/${id}`);
  },

  accessShareLink: async (data: ShareAccessRequest): Promise<ShareAccessResponse> => {
    return apiPost<ShareAccessResponse>('/shares/access', data);
  },

  revokeShareLink: async (id: string): Promise<void> => {
    return apiPost<void>(`/shares/${id}/revoke`);
  },
};

export default shareApi;
