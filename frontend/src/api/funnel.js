import request from '@/utils/request'

export function getFunnelData(params = {}) {
  return request({
    url: '/funnel/data',
    method: 'get',
    params
  })
}

export function getFunnelVehiclesByStage(stageIndex, params = {}) {
  return request({
    url: `/funnel/stage/${stageIndex}/vehicles`,
    method: 'get',
    params
  })
}

export function refreshFunnelData() {
  return request({
    url: '/funnel/refresh',
    method: 'post'
  })
}

export function getFunnelAnomalies() {
  return request({
    url: '/funnel/anomalies',
    method: 'get'
  })
}

export function addReviewNote(data) {
  return request({
    url: '/funnel/review-note',
    method: 'post',
    data
  })
}

export function getReviewNotes(anomalyId) {
  return request({
    url: `/funnel/review-note/${anomalyId}`,
    method: 'get'
  })
}

export function exportFunnelReport(params = {}) {
  return request({
    url: '/funnel/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export async function getAllFunnelVehicles() {
  const stages = [0, 1, 2, 3, 4]
  const results = await Promise.allSettled(
    stages.map(i => getFunnelVehiclesByStage(i))
  )
  const map = new Map()
  results.forEach(r => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      r.value.forEach(v => {
        if (v && v.id && !map.has(v.id)) map.set(v.id, v)
      })
    }
  })
  return Array.from(map.values())
}
