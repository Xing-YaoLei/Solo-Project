import { AxiosResponse } from 'axios';
import api from './client';

export const diagnosisApi = {
  getDiagnoses(params?: { vehicleId?: string; workOrderId?: string }): Promise<AxiosResponse<any>> {
    return api.get('/diagnoses', { params });
  },

  getDiagnosisById(id: string): Promise<AxiosResponse<any>> {
    return api.get(`/diagnoses/${id}`);
  },

  createDiagnosis(data: any): Promise<AxiosResponse<any>> {
    return api.post('/diagnoses', data);
  },
};

export default diagnosisApi;
