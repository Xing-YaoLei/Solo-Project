import api from './api';
import type {
  ElderListDto,
  ElderDetailDto,
  CreateElderDto,
  UpdateElderDto,
  ElderQueryDto,
  PagedResultDto,
  MedicationDto,
  CreateMedicationDto,
} from '@/types';

export const elderService = {
  getList: (query?: ElderQueryDto): Promise<PagedResultDto<ElderListDto>> => {
    return api.get('/elders', { params: query });
  },

  getById: (id: string): Promise<ElderDetailDto> => {
    return api.get(`/elders/${id}`);
  },

  create: (dto: CreateElderDto): Promise<ElderDetailDto> => {
    return api.post('/elders', dto);
  },

  update: (id: string, dto: UpdateElderDto): Promise<ElderDetailDto> => {
    return api.put(`/elders/${id}`, dto);
  },

  delete: (id: string): Promise<void> => {
    return api.delete(`/elders/${id}`);
  },

  getMedications: (id: string): Promise<MedicationDto[]> => {
    return api.get(`/elders/${id}/medications`);
  },

  addMedication: (id: string, dto: CreateMedicationDto): Promise<MedicationDto> => {
    return api.post(`/elders/${id}/medications`, dto);
  },

  deleteMedication: (medicationId: string): Promise<void> => {
    return api.delete(`/elders/medications/${medicationId}`);
  },
};
