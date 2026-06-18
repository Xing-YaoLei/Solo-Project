import request from './request'

export function getVehicles() {
  return request.get('/api/vehicles')
}

export function getVehicle(id) {
  return request.get(`/api/vehicles/${id}`)
}

export function createVehicle(data) {
  return request.post('/api/vehicles', data)
}
