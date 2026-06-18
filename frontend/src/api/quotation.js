import request from '@/utils/request'

export function getQuotationList(params = {}) {
  return request({
    url: '/quotations',
    method: 'get',
    params
  })
}

export function getQuotationDetail(id) {
  return request({
    url: `/quotations/${id}`,
    method: 'get'
  })
}

export function createQuotation(data) {
  return request({
    url: '/quotations',
    method: 'post',
    data
  })
}

export function updateQuotation(id, data) {
  return request({
    url: `/quotations/${id}`,
    method: 'put',
    data
  })
}

export function deleteQuotation(id) {
  return request({
    url: `/quotations/${id}`,
    method: 'delete'
  })
}

export function getQuotationHistory(vehicleId) {
  return request({
    url: `/quotations/car/${vehicleId}`,
    method: 'get'
  })
}

export function getQuotationsByUser(userId) {
  return request({
    url: `/quotations/quoted-by/${userId}`,
    method: 'get'
  })
}

export function exportQuotationList(params = {}) {
  return request({
    url: '/export/funnel',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
