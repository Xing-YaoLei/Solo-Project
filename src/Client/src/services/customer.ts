import request from '@/utils/request'
import type {
  CustomerProfile,
  CustomerProfileQuery,
  CustomerProfileCreate,
  CustomerProfileUpdate,
  PagedResult
} from '@/types'

export function getCustomerList(params: CustomerProfileQuery): Promise<PagedResult<CustomerProfile>> {
  return request.get('/CustomerProfile', { params })
}

export function getCustomerDetail(id: number): Promise<CustomerProfile> {
  return request.get(`/CustomerProfile/${id}`)
}

export function createCustomer(data: CustomerProfileCreate): Promise<CustomerProfile> {
  return request.post('/CustomerProfile', data)
}

export function updateCustomer(data: CustomerProfileUpdate): Promise<CustomerProfile> {
  return request.put('/CustomerProfile', data)
}

export function deleteCustomer(id: number): Promise<void> {
  return request.delete(`/CustomerProfile/${id}`)
}

export function searchCustomers(keyword: string): Promise<CustomerProfile[]> {
  return request.get('/CustomerProfile/search', { params: { keyword } })
}
