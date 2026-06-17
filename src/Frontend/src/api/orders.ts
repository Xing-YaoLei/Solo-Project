import { get, post, put, del, download } from '@/utils/request'
import type {
  PagedResult,
  MoveOutOrderListDto,
  MoveOutOrderDetailDto,
  MoveOutOrderQueryDto,
  CreateMoveOutOrderDto,
  UpdateMoveOutOrderDto,
  TimelineEventDto,
  CreateTimelineNoteDto,
  UtilityReadingDto,
  UtilitySummaryDto,
  CreateUtilityReadingDto,
  InspectionItemDto,
  InspectionRecordDto,
  InspectionSummaryDto,
  CreateInspectionRecordDto,
  PaymentRecordDto,
  PaymentSummaryDto,
  CreatePaymentRecordDto,
  ComplaintTagDto,
  ComplaintSummaryDto,
  CreateComplaintTagDto,
} from '@/types'

export const orderApi = {
  getList: (params: MoveOutOrderQueryDto): Promise<PagedResult<MoveOutOrderListDto>> => {
    return get<PagedResult<MoveOutOrderListDto>>('/moveoutorders', { params })
  },

  getDetail: (id: string): Promise<MoveOutOrderDetailDto> => {
    return get<MoveOutOrderDetailDto>(`/moveoutorders/${id}`)
  },

  create: (data: CreateMoveOutOrderDto): Promise<MoveOutOrderDetailDto> => {
    return post<MoveOutOrderDetailDto>('/moveoutorders', data)
  },

  update: (id: string, data: UpdateMoveOutOrderDto): Promise<MoveOutOrderDetailDto> => {
    return put<MoveOutOrderDetailDto>(`/moveoutorders/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return del<void>(`/moveoutorders/${id}`)
  },

  getTimeline: (id: string): Promise<TimelineEventDto[]> => {
    return get<TimelineEventDto[]>(`/moveoutorders/${id}/timeline`)
  },

  addTimelineNote: (data: CreateTimelineNoteDto): Promise<TimelineEventDto> => {
    return post<TimelineEventDto>('/moveoutorders/timeline/note', data)
  },

  assignHandler: (id: string, handlerId: string): Promise<void> => {
    return put<void>(`/moveoutorders/${id}/assign`, { handlerId })
  },

  updateStatus: (id: string, status: number): Promise<void> => {
    return put<void>(`/moveoutorders/${id}/status`, { status })
  },

  getUtilityReadings: (orderId: string): Promise<{ items: UtilityReadingDto[]; summary: UtilitySummaryDto }> => {
    return get(`/moveoutorders/${orderId}/utility-readings`)
  },

  createUtilityReading: (orderId: string, data: CreateUtilityReadingDto): Promise<UtilityReadingDto> => {
    return post<UtilityReadingDto>(`/moveoutorders/${orderId}/utility-readings`, data)
  },

  getInspectionItems: (orderId: string): Promise<InspectionItemDto[]> => {
    return get<InspectionItemDto[]>(`/moveoutorders/${orderId}/inspection-items`)
  },

  getInspectionRecords: (orderId: string): Promise<{ items: InspectionRecordDto[]; summary: InspectionSummaryDto }> => {
    return get(`/moveoutorders/${orderId}/inspection-records`)
  },

  createInspectionRecord: (orderId: string, data: CreateInspectionRecordDto): Promise<InspectionRecordDto> => {
    return post<InspectionRecordDto>(`/moveoutorders/${orderId}/inspection-records`, data)
  },

  getPayments: (orderId: string): Promise<{ items: PaymentRecordDto[]; summary: PaymentSummaryDto }> => {
    return get(`/moveoutorders/${orderId}/payments`)
  },

  createPayment: (orderId: string, data: CreatePaymentRecordDto): Promise<PaymentRecordDto> => {
    return post<PaymentRecordDto>(`/moveoutorders/${orderId}/payments`, data)
  },

  getComplaints: (orderId: string): Promise<{ items: ComplaintTagDto[]; summary: ComplaintSummaryDto }> => {
    return get(`/moveoutorders/${orderId}/complaints`)
  },

  createComplaint: (orderId: string, data: CreateComplaintTagDto): Promise<ComplaintTagDto> => {
    return post<ComplaintTagDto>(`/moveoutorders/${orderId}/complaints`, data)
  },

  exportOrders: (params?: MoveOutOrderQueryDto): Promise<void> => {
    return download('/moveoutorders/export', params as Record<string, unknown>, `moveout_orders_${Date.now()}.csv`)
  },
}

export default orderApi
