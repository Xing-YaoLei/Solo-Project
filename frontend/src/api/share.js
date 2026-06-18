import request from '@/utils/request'

export const ROLE_OPTIONS = [
  { value: 'ASSESSOR', label: '评估师' },
  { value: 'SALES', label: '销售' },
  { value: 'FINANCE_STAFF', label: '金融专员' },
  { value: 'STORE_MANAGER', label: '店长' }
]

export function getShareList(params = {}) {
  return request({
    url: '/share-links',
    method: 'get',
    params
  })
}

export function createShareLink(data) {
  return request({
    url: '/share-links',
    method: 'post',
    data
  })
}

export function getShareDetail(id) {
  return request({
    url: `/share-links/${id}`,
    method: 'get'
  })
}

export function getShareByToken(token) {
  return request({
    url: `/share-links/token/${token}`,
    method: 'get'
  })
}

export function validateShareAccess(token, userRole) {
  return request({
    url: `/share-links/token/${token}/access`,
    method: 'get',
    params: { userRole }
  })
}

export function updateShareLink(id, data) {
  return request({
    url: `/share-links/${id}`,
    method: 'put',
    data
  })
}

export function deleteShareLink(id) {
  return request({
    url: `/share-links/${id}`,
    method: 'delete'
  })
}

export function revokeShareLink(id) {
  return request({
    url: `/share-links/${id}`,
    method: 'delete'
  })
}

export function getShareAccessLogs(shareId) {
  return request({
    url: `/share-links/${shareId}`,
    method: 'get'
  })
}

export function getPublicShareData(token, userRole) {
  return request({
    url: `/public/share/${token}`,
    method: 'get',
    headers: userRole ? { 'X-User-Role': userRole } : {}
  })
}
