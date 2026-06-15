import request from '@/utils/request'

export const getBatch = (batchId) => {
  return request.get(`/batches/${batchId}`)
}

export const getRecentBatches = (limit = 10) => {
  return request.get('/batches/recent', { params: { limit } })
}

export const getBatchesByType = (batchType) => {
  return request.get(`/batches/type/${batchType}`)
}

export const getDelayedBatches = () => {
  return request.get('/batches/delayed')
}

export const getBatchesByTimeRange = (batchType, startTime, endTime) => {
  return request.get('/batches/time-range', {
    params: { batchType, startTime, endTime }
  })
}

export const createBatch = (data) => {
  return request.post('/batches/create', null, { params: data })
}

export const completeBatch = (batchId, data) => {
  return request.post(`/batches/${batchId}/complete`, null, { params: data })
}

export const failBatch = (batchId, failReason) => {
  return request.post(`/batches/${batchId}/fail`, null, { params: { failReason } })
}
