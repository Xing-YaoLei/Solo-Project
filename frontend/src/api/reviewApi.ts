import { AxiosResponse } from 'axios';
import api from './client';

export const reviewApi = {
  addReviewOpinion(data: any): Promise<AxiosResponse<any>> {
    return api.post('/review-opinions', data);
  },
};

export default reviewApi;
