import client from '../client';
import type { SponsorshipItem, SponsorshipDetail, DateRange, PageResponse } from '@/types';

export interface SponsorshipParams extends Partial<DateRange> {
  status?: SponsorshipItem['status'];
}

export const sponsorshipApi = {
  getList(params?: SponsorshipParams & { page?: number; pageSize?: number }) {
    return client.get<PageResponse<SponsorshipItem>>('/sponsorship/list', { params });
  },

  getDetail(id: string) {
    return client.get<SponsorshipDetail>(`/sponsorship/${id}/detail`);
  },
};

export default sponsorshipApi;
