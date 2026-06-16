import api from './api';
import type { BedDto } from '@/types';

export const bedService = {
  getAll: (): Promise<BedDto[]> => {
    return api.get('/beds');
  },

  getAvailable: (): Promise<BedDto[]> => {
    return api.get('/beds/available');
  },

  getById: (id: string): Promise<BedDto> => {
    return api.get(`/beds/${id}`);
  },
};
