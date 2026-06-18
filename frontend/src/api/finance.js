import request from '@/utils/request'

export function getFinanceList(params = {}) {
  return request({
    url: '/finance/list',
    method: 'get',
    params
  })
}

export function getFinanceDetail(id) {
  return request({
    url: `/finance/${id}`,
    method: 'get'
  })
}

export function createFinance(data) {
  return request({
    url: '/finance',
    method: 'post',
    data
  })
}

export function updateFinance(id, data) {
  return request({
    url: `/finance/${id}`,
    method: 'put',
    data
  })
}

export function deleteFinance(id) {
  return request({
    url: `/finance/${id}`,
    method: 'delete'
  })
}

export function uploadFinanceDocument(formData) {
  return request({
    url: '/finance/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function approveFinance(id, data) {
  return request({
    url: `/finance/${id}/approve`,
    method: 'post',
    data
  })
}

export function getCaliberHistory() {
  return request({
    url: '/finance/caliber-history',
    method: 'get'
  })
}
