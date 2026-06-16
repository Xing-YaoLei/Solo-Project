import request from './request'
import type {
  RestockOrder,
  RestockOrderDetail,
  RestockOrderQuery,
  InsuranceRecord,
  InsuranceRecordQuery,
  Store,
  PagedResult,
  StatisticsDto,
  PrescriptionStatisticsDto,
  StoreStatisticsDto,
  StatisticsQuery,
  FollowUp,
  FollowUpCreate,
  FollowUpUpdate,
} from '@/types'

export const getRestockOrders = (params: RestockOrderQuery): Promise<PagedResult<RestockOrder>> => {
  return request.get('/restock-orders', { params })
}

export const getRestockOrderById = (id: number): Promise<RestockOrderDetail> => {
  return request.get(`/restock-orders/${id}`)
}

export const getInsuranceRecords = (params: InsuranceRecordQuery): Promise<PagedResult<InsuranceRecord>> => {
  return request.get('/insurance-records', { params })
}

export const getInsuranceRecordById = (id: number): Promise<InsuranceRecord> => {
  return request.get(`/insurance-records/${id}`)
}

export const getStores = (): Promise<Store[]> => {
  return request.get('/stores')
}

export const getStoreById = (id: number): Promise<Store> => {
  return request.get(`/stores/${id}`)
}

export const getStatisticsOverview = (params: StatisticsQuery): Promise<StatisticsDto> => {
  return request.get('/statistics/overview', { params })
}

export const getPrescriptionTrend = (params: StatisticsQuery): Promise<PrescriptionStatisticsDto[]> => {
  return request.get('/statistics/prescription-trend', { params })
}

export const getStoreStatistics = (params: StatisticsQuery): Promise<StoreStatisticsDto[]> => {
  return request.get('/statistics/store-statistics', { params })
}

export const getFollowUpByPrescriptionId = (prescriptionId: number): Promise<FollowUp> => {
  return request.get(`/follow-ups/prescription/${prescriptionId}`)
}

export const createFollowUp = (prescriptionId: number, data: FollowUpCreate): Promise<FollowUp> => {
  return request.post(`/follow-ups/prescription/${prescriptionId}`, data)
}

export const updateFollowUp = (id: number, data: FollowUpUpdate): Promise<void> => {
  return request.put(`/follow-ups/${id}`, data)
}
