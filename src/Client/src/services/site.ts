import request from '@/utils/request'
import type {
  ConstructionSite,
  ConstructionSiteQuery,
  ConstructionSiteCreate,
  ConstructionSiteUpdate,
  ConstructionSiteStatusUpdate,
  PagedResult,
  Area,
  PersonInCharge
} from '@/types'

export function getSiteList(params: ConstructionSiteQuery): Promise<PagedResult<ConstructionSite>> {
  return request.get('/ConstructionSite', { params })
}

export function getSiteDetail(id: number): Promise<ConstructionSite> {
  return request.get(`/ConstructionSite/${id}`)
}

export function createSite(data: ConstructionSiteCreate): Promise<ConstructionSite> {
  return request.post('/ConstructionSite', data)
}

export function updateSite(data: ConstructionSiteUpdate): Promise<ConstructionSite> {
  return request.put('/ConstructionSite', data)
}

export function updateSiteStatus(data: ConstructionSiteStatusUpdate): Promise<void> {
  return request.put('/ConstructionSite/status', data)
}

export function deleteSite(id: number): Promise<void> {
  return request.delete(`/ConstructionSite/${id}`)
}

export function getAreaList(): Promise<Area[]> {
  return request.get('/ConstructionSite/areas')
}

export function getPersonInChargeList(): Promise<PersonInCharge[]> {
  return request.get('/ConstructionSite/persons')
}
