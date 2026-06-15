import request from '@/utils/request'

export const statisticsApi = {
  getAttendanceRate(params) {
    return request.get('/statistics/attendance-rate', { params })
  },
  getTrend(params) {
    return request.get('/statistics/trend', { params })
  },
  drillDown(params) {
    return request.get('/statistics/drill-down', { params })
  }
}
