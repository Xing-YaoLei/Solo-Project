import request from '@/utils/request'
import type {
  AuthScopeThreshold,
  AuthScopeThresholdQuery,
  AuthScopeThresholdCreate,
  AuthScopeThresholdUpdate,
  PagedResult
} from '@/types'

export function getAuthScopeList(params: AuthScopeThresholdQuery): Promise<PagedResult<AuthScopeThreshold>> {
  return request.get('/AuthScopeThreshold', { params })
}

export function getAuthScopeDetail(id: number): Promise<AuthScopeThreshold> {
  return request.get(`/AuthScopeThreshold/${id}`)
}

export function createAuthScope(data: AuthScopeThresholdCreate): Promise<AuthScopeThreshold> {
  return request.post('/AuthScopeThreshold', data)
}

export function updateAuthScope(data: AuthScopeThresholdUpdate): Promise<AuthScopeThreshold> {
  return request.put('/AuthScopeThreshold', data)
}

export function deleteAuthScope(id: number): Promise<void> {
  return request.delete(`/AuthScopeThreshold/${id}`)
}

export function getActiveAuthScopes(): Promise<AuthScopeThreshold[]> {
  return request.get('/AuthScopeThreshold/active')
}
