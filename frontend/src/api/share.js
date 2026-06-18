import request from '@/utils/request'

export function getShareList(params = {}) {
  return request({
    url: '/share/list',
    method: 'get',
    params
  })
}

export function createShareLink(data) {
  return request({
    url: '/share',
    method: 'post',
    data
  })
}

export function getShareDetail(token) {
  return request({
    url: `/share/${token}`,
    method: 'get'
  })
}

export function updateShareLink(id, data) {
  return request({
    url: `/share/${id}`,
    method: 'put',
    data
  })
}

export function deleteShareLink(id) {
  return request({
    url: `/share/${id}`,
    method: 'delete'
  })
}

export function revokeShareLink(id) {
  return request({
    url: `/share/${id}/revoke`,
    method: 'post'
  })
}

export function getShareAccessLogs(shareId) {
  return request({
    url: `/share/${shareId}/access-logs`,
    method: 'get'
  })
}
