import request from './request'

export function getConversionStats(params) {
  return request.get('/api/monthly-review/conversion-stats', { params })
}

export function getExportMeta(params) {
  return request.get('/api/monthly-review/export-meta', { params })
}

export function exportMonthlyReport(params) {
  return request.get('/api/monthly-review/export', {
    params,
    responseType: 'blob'
  })
}
