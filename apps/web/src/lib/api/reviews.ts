import apiClient from './axios';
import type {
  ReviewRecord,
  ReviewResult,
  ReviewTargetType,
  PaginationParams,
  PaginatedResult,
} from './types';

export interface CreateReviewRequest {
  targetType: ReviewTargetType;
  targetId: string;
  result: ReviewResult;
  comment?: string;
}

export interface ReviewFilters {
  targetType?: ReviewTargetType;
  targetId?: string;
  result?: ReviewResult;
  reviewerId?: string;
  taskId?: string;
  evidenceId?: string;
}

export interface ReviewHistory {
  totalRounds: number;
  latestResult?: ReviewResult;
  latestReview?: ReviewRecord;
  allReviews: ReviewRecord[];
  summary: {
    approved: number;
    rejected: number;
    needRevision: number;
  };
}

export const reviewsApi = {
  getReviews: async (
    params: PaginationParams & ReviewFilters = {},
  ): Promise<PaginatedResult<ReviewRecord>> => {
    const { data } = await apiClient.get('/reviews', { params });
    return data;
  },

  getReview: async (id: string): Promise<ReviewRecord> => {
    const { data } = await apiClient.get(`/reviews/${id}`);
    return data;
  },

  createReview: async (data: CreateReviewRequest): Promise<ReviewRecord> => {
    const res = await apiClient.post('/reviews', data);
    return res.data;
  },

  getReviewsByTarget: async (
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewRecord[]> => {
    const { data } = await apiClient.get(
      `/reviews/target/${targetType}/${targetId}`,
    );
    return data;
  },

  getReviewHistory: async (
    targetType: ReviewTargetType,
    targetId: string,
  ): Promise<ReviewHistory> => {
    const { data } = await apiClient.get('/reviews/history', {
      params: { targetType, targetId },
    });
    return data;
  },
};
