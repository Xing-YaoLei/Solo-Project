import request from '@/utils/request'

export function getQuotationList(params = {}) {
  return request({
    url: '/quotation/list',
    method: 'get',
    params
  })
}

export function getQuotationDetail(id) {
  return request({
    url: `/quotation/${id}`,
    method: 'get'
  })
}

export function createQuotation(data) {
  return request({
    url: '/quotation',
    method: 'post',
    data
  })
}

export function updateQuotation(id, data) {
  return request({
    url: `/quotation/${id}`,
    method: 'put',
    data
  })
}

export function deleteQuotation(id) {
  return request({
    url: `/quotation/${id}`,
    method: 'delete'
  })
}

export function getQuotationHistory(vehicleId) {
  return request({
    url: `/quotation/vehicle/${vehicleId}/history`,
    method: 'get'
  })
}

export function exportQuotationList(params = {}) {
  return request({
    url: '/quotation/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
