import request from '@/utils/request'

export function getFinanceList(params = {}) {
  return request({
    url: '/finance-documents',
    method: 'get',
    params
  })
}

export function getFinanceDetail(id) {
  return request({
    url: `/finance-documents/${id}`,
    method: 'get'
  })
}

export function createFinance(data) {
  return request({
    url: '/finance-documents',
    method: 'post',
    data
  })
}

export function updateFinance(id, data) {
  return request({
    url: `/finance-documents/${id}`,
    method: 'put',
    data
  })
}

export function deleteFinance(id) {
  return request({
    url: `/finance-documents/${id}`,
    method: 'delete'
  })
}

export function getFinanceByCar(carId) {
  return request({
    url: `/finance-documents/car/${carId}`,
    method: 'get'
  })
}

export function getMissingByCar(carId) {
  return request({
    url: `/finance-documents/car/${carId}/missing`,
    method: 'get'
  })
}

export function countMissingByCar(carId) {
  return request({
    url: `/finance-documents/car/${carId}/missing-count`,
    method: 'get'
  })
}

export function getFinanceByCarAndType(carId, docType) {
  return request({
    url: `/finance-documents/car/${carId}/doc-type/${docType}`,
    method: 'get'
  })
}

export function getMissingCars() {
  return request({
    url: '/finance-documents/missing-cars',
    method: 'get'
  })
}

export function checkDocsComplete(carId) {
  return request({
    url: `/finance-documents/car/${carId}/check-complete`,
    method: 'get'
  })
}

export function uploadFinanceDocument(formData) {
  return request({
    url: '/finance-documents',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function approveFinance(id, data) {
  return request({
    url: `/finance-documents/${id}`,
    method: 'put',
    data
  })
}

export function getCaliberHistory() {
  return request({
    url: '/finance-documents',
    method: 'get'
  })
}
