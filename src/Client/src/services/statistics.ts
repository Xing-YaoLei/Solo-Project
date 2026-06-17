import request from '@/utils/request'
import type {
  StatisticsOverview,
  MaterialCompleteRate,
  AreaStatistics,
  PersonStatistics,
  MaterialStatistics,
  ReviewQuery,
  PagedResult
} from '@/types'

export function getStatisticsOverview(): Promise<StatisticsOverview> {
  return request.get('/Statistics/overview')
}

export function getMaterialCompleteRateList(params: ReviewQuery & { pageIndex?: number; pageSize?: number }): Promise<PagedResult<MaterialCompleteRate>> {
  return request.get('/Statistics/material-complete-rate', { params })
}

export function getAreaStatistics(params?: ReviewQuery): Promise<AreaStatistics[]> {
  return request.get('/Statistics/area', { params })
}

export function getPersonStatistics(params?: ReviewQuery): Promise<PersonStatistics[]> {
  return request.get('/Statistics/person', { params })
}

export function getMaterialStatistics(params?: ReviewQuery): Promise<MaterialStatistics[]> {
  return request.get('/Statistics/material', { params })
}

export function exportReviewReport(params: ReviewQuery): Promise<Blob> {
  return request.get('/Statistics/export', { params, responseType: 'blob' })
}
