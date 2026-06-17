import request from '@/utils/request'
import type {
  TimelineChange,
  TimelineChangeQuery,
  TimelineChangeCreate,
  PagedResult
} from '@/types'

export function getTimelineList(params: TimelineChangeQuery): Promise<PagedResult<TimelineChange>> {
  return request.get('/TimelineChange', { params })
}

export function getTimelineDetail(id: number): Promise<TimelineChange> {
  return request.get(`/TimelineChange/${id}`)
}

export function createTimelineChange(data: TimelineChangeCreate): Promise<TimelineChange> {
  return request.post('/TimelineChange', data)
}

export function getSiteTimeline(siteId: number): Promise<TimelineChange[]> {
  return request.get(`/TimelineChange/site/${siteId}`)
}
