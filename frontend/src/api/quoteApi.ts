import { AxiosResponse } from 'axios';
import api from './client';

export const quoteApi = {
  getQuotes(workOrderId?: string): Promise<AxiosResponse<any>> {
    return api.get('/quotes', { params: { workOrderId } });
  },

  getQuoteById(id: string): Promise<AxiosResponse<any>> {
    return api.get(`/quotes/${id}`);
  },

  createQuote(data: any): Promise<AxiosResponse<any>> {
    return api.post('/quotes', data);
  },

  updateQuoteStatus(id: string, status: string): Promise<AxiosResponse<any>> {
    return api.put(`/quotes/${id}/status`, { status });
  },

  deleteQuote(id: string): Promise<AxiosResponse<any>> {
    return api.delete(`/quotes/${id}`);
  },
};

export default quoteApi;
