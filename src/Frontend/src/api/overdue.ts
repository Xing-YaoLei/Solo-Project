import { get, post, put } from '@/utils/request'
import type {
  PagedResult,
  RentOverdueRecordDto,
  RentOverdueQueryDto,
  CreateRentOverdueRecordDto,
  AffectedPartyDto,
  ResponsibilityAdjustmentDto,
  SupplementAffectedPartyDto,
  AdjustResponsibilityDto,
  TimelineEventDto,
} from '@/types'

export const overdueApi = {
  getOverdueList: (params: RentOverdueQueryDto): Promise<PagedResult<RentOverdueRecordDto>> => {
    return get<PagedResult<RentOverdueRecordDto>>('/rent-overdue', { params })
  },

  getOverdueDetail: (id: string): Promise<RentOverdueRecordDto> => {
    return get<RentOverdueRecordDto>(`/rent-overdue/${id}`)
  },

  createOverdue: (data: CreateRentOverdueRecordDto): Promise<RentOverdueRecordDto> => {
    return post<RentOverdueRecordDto>('/rent-overdue', data)
  },

  supplementAffectedParty: (
    overdueId: string,
    affectedPartyId: string,
    data: SupplementAffectedPartyDto
  ): Promise<AffectedPartyDto> => {
    return put<AffectedPartyDto>(`/rent-overdue/${overdueId}/affected-parties/${affectedPartyId}/supplement`, data)
  },

  adjustResponsibility: (overdueId: string, data: AdjustResponsibilityDto): Promise<ResponsibilityAdjustmentDto> => {
    return post<ResponsibilityAdjustmentDto>(`/rent-overdue/${overdueId}/responsibility-adjustments`, data)
  },

  getTimeline: (id: string): Promise<TimelineEventDto[]> => {
    return get<TimelineEventDto[]>(`/rent-overdue/${id}/timeline`)
  },
}

export default overdueApi
