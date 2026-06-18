import request from '@/utils/request'

export function getArchiveList(params = {}) {
  return request({
    url: '/vehicle-archives',
    method: 'get',
    params
  })
}

export function getArchiveDetail(id) {
  return request({
    url: `/vehicle-archives/${id}`,
    method: 'get'
  })
}

export function createArchive(data) {
  return request({
    url: '/vehicle-archives',
    method: 'post',
    data
  })
}

export function saveArchiveByCar(carId, data) {
  return request({
    url: `/vehicle-archives/car/${carId}`,
    method: 'post',
    data
  })
}

export function updateArchive(id, data) {
  return request({
    url: `/vehicle-archives/${id}`,
    method: 'put',
    data
  })
}

export function patchArchiveData(carId, archiveData) {
  return request({
    url: `/vehicle-archives/car/${carId}/data`,
    method: 'patch',
    data: archiveData
  })
}

export function deleteArchive(id) {
  return request({
    url: `/vehicle-archives/${id}`,
    method: 'delete'
  })
}

export function getArchiveByCar(carId) {
  return request({
    url: `/vehicle-archives/car/${carId}`,
    method: 'get'
  })
}

export function getIncompleteArchives() {
  return request({
    url: '/vehicle-archives/incomplete',
    method: 'get'
  })
}

export function checkArchiveComplete(carId) {
  return request({
    url: `/vehicle-archives/car/${carId}/check-complete`,
    method: 'get'
  })
}

export function getArchiveByStage(stage, params = {}) {
  return request({
    url: '/vehicle-archives',
    method: 'get',
    params: { ...params, stage }
  })
}

export function getInventoryStats(params = {}) {
  return request({
    url: '/inventory-turnover',
    method: 'get',
    params
  })
}

export function exportArchiveList(params = {}) {
  return request({
    url: '/export/inventory-turnover',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
