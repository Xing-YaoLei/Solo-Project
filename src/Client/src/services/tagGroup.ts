import request from '@/utils/request'
import type {
  TagGroupRule,
  TagGroupRuleQuery,
  TagGroupRuleCreate,
  TagGroupRuleUpdate,
  PagedResult
} from '@/types'

export function getTagGroupList(params: TagGroupRuleQuery): Promise<PagedResult<TagGroupRule>> {
  return request.get('/TagGroupRule', { params })
}

export function getTagGroupDetail(id: number): Promise<TagGroupRule> {
  return request.get(`/TagGroupRule/${id}`)
}

export function createTagGroup(data: TagGroupRuleCreate): Promise<TagGroupRule> {
  return request.post('/TagGroupRule', data)
}

export function updateTagGroup(data: TagGroupRuleUpdate): Promise<TagGroupRule> {
  return request.put('/TagGroupRule', data)
}

export function deleteTagGroup(id: number): Promise<void> {
  return request.delete(`/TagGroupRule/${id}`)
}

export function getActiveTagGroups(): Promise<TagGroupRule[]> {
  return request.get('/TagGroupRule/active')
}
