import request from '@/utils/request'
import type {
  MaterialSubmission,
  MaterialSubmissionQuery,
  MaterialSubmissionCreate,
  MaterialSubmissionUpdate,
  MaterialSubmissionReview,
  MaterialSubmissionRetry,
  MaterialSubmissionClose,
  PagedResult
} from '@/types'

export function getSubmissionList(params: MaterialSubmissionQuery): Promise<PagedResult<MaterialSubmission>> {
  return request.get('/MaterialSubmission', { params })
}

export function getSubmissionDetail(id: number): Promise<MaterialSubmission> {
  return request.get(`/MaterialSubmission/${id}`)
}

export function createSubmission(data: MaterialSubmissionCreate): Promise<MaterialSubmission> {
  return request.post('/MaterialSubmission', data)
}

export function updateSubmission(data: MaterialSubmissionUpdate): Promise<MaterialSubmission> {
  return request.put('/MaterialSubmission', data)
}

export function reviewSubmission(data: MaterialSubmissionReview): Promise<void> {
  return request.put('/MaterialSubmission/review', data)
}

export function retrySubmission(data: MaterialSubmissionRetry): Promise<MaterialSubmission> {
  return request.put('/MaterialSubmission/retry', data)
}

export function closeSubmission(data: MaterialSubmissionClose): Promise<void> {
  return request.put('/MaterialSubmission/close', data)
}

export function getSiteSubmissions(siteId: number): Promise<MaterialSubmission[]> {
  return request.get(`/MaterialSubmission/site/${siteId}`)
}

export function deleteSubmission(id: number): Promise<void> {
  return request.delete(`/MaterialSubmission/${id}`)
}
