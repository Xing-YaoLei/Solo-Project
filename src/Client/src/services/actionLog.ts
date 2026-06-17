import request from '@/utils/request'
import type {
  ActionLog,
  ActionLogQuery,
  PagedResult
} from '@/types'

export function getActionLogList(params: ActionLogQuery): Promise<PagedResult<ActionLog>> {
  return request.get('/ActionLog', { params })
}

export function getActionLogDetail(id: number): Promise<ActionLog> {
  return request.get(`/ActionLog/${id}`)
}

export function getSiteActionLogs(siteId: number): Promise<ActionLog[]> {
  return request.get(`/ActionLog/site/${siteId}`)
}
