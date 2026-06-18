import request from '@/utils/request'

export function getArchiveList(params = {}) {
  return request({
    url: '/archive/list',
    method: 'get',
    params
  })
}

export function getArchiveDetail(id) {
  return request({
    url: `/archive/${id}`,
    method: 'get'
  })
}

export function createArchive(data) {
  return request({
    url: '/archive',
    method: 'post',
    data
  })
}

export function updateArchive(id, data) {
  return request({
    url: `/archive/${id}`,
    method: 'put',
    data
  })
}

export function deleteArchive(id) {
  return request({
    url: `/archive/${id}`,
    method: 'delete'
  })
}

export function getArchiveByStage(stage, params = {}) {
  return request({
    url: `/archive/stage/${stage}`,
    method: 'get',
    params
  })
}

export function getInventoryStats(params = {}) {
  return request({
    url: '/archive/inventory-stats',
    method: 'get',
    params
  })
}

export function exportArchiveList(params = {}) {
  return request({
    url: '/archive/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
