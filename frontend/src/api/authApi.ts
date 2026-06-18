import { AxiosResponse } from 'axios';
import api from './client';

export const authApi = {
  login(email: string, password: string): Promise<AxiosResponse<any>> {
    return api.post('/auth/login', { email, password });
  },

  getCurrentUser(): Promise<AxiosResponse<any>> {
    return api.get('/auth/me');
  },

  getTechnicians(): Promise<AxiosResponse<any>> {
    return api.get('/auth/technicians');
  },
};

export default authApi;
