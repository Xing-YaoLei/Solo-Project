import api from './api';
import type { CareLevelDto } from '@/types';

export const careLevelService = {
  getAll: (): Promise<CareLevelDto[]> => {
    return api.get('/carelevels');
  },

  getById: (id: string): Promise<CareLevelDto> => {
    return api.get(`/carelevels/${id}`);
  },
};
