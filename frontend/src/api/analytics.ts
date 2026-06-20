import request from '../utils/request'

export interface SeatTrendPoint {
  timestamp: string
  sold: number
  available: number
  reserved: number
  occupancy_rate: number
}

export interface SeatTrendResponse {
  schedule_id: number
  performance_name: string
  data: SeatTrendPoint[]
}

export interface SignCodeComposition {
  code_type: string
  count: number
  percentage: number
  used_count: number
  used_percentage: number
}

export interface SignCodeCompositionResponse {
  schedule_id: number
  total_codes: number
  composition: SignCodeComposition[]
}

export interface Sponsor {
  id: number
  schedule_id: number
  sponsor_name: string
  sponsor_type: string
  sponsorship_level: string
  contribution_amount: string
  in_kind_items: string
  ticket_allocation: number
  contact_person: string
  contact_phone: string
  contract_no: string
  status: string
  notes: string
  created_at: string
}

export interface CheckinRecord {
  id: number
  schedule_id: number
  order_id: number | null
  sign_code_id: number | null
  user_identifier: string | null
  checkin_time: string
  checkin_channel: string
  camera_verified: boolean
  camera_snapshot_id: string | null
  is_anomaly: boolean
  anomaly_type: string | null
  anomaly_description: string | null
  staff_id: string | null
  staff_name: string | null
}

export interface PerformanceSchedule {
  id: number
  performance_name: string
  venue: string
  performance_date: string
  start_time: string
  end_time: string
  total_seats: number
  status: string
  risk_level: string
  risk_notes: string | null
  created_at: string
}

export interface DashboardOverview {
  last_refresh_time: string
  total_performances: number
  total_tickets_sold: number
  total_revenue: string
  checkin_rate: number
  anomaly_count: number
}

export interface DataRefreshStatus {
  data_type: string
  last_refresh: string | null
  status: string
  records_count: number
}

export interface MetricDefinition {
  id: number
  metric_code: string
  metric_name: string
  category: string | null
  definition: string
  calculation_formula: string | null
  unit: string | null
  data_source: string | null
  refresh_frequency: string | null
  version: string
  is_active: boolean
  created_at: string
}

export const analyticsApi = {
  getOverview: () => request.get<unknown, DashboardOverview>('/analytics/overview'),
  getRefreshStatus: () => request.get<unknown, DataRefreshStatus[]>('/analytics/refresh-status'),
  listSchedules: () => request.get<unknown, PerformanceSchedule[]>('/analytics/schedules'),
  getSeatTrend: (scheduleId: number) =>
    request.get<unknown, SeatTrendResponse>(`/analytics/seat-trend/${scheduleId}`),
  getSignCodeComposition: (scheduleId: number) =>
    request.get<unknown, SignCodeCompositionResponse>(`/analytics/sign-code-composition/${scheduleId}`),
  getSponsors: (scheduleId: number) =>
    request.get<unknown, Sponsor[]>(`/analytics/sponsors/${scheduleId}`),
  getAnomalyCheckins: (scheduleId?: number) =>
    request.get<unknown, CheckinRecord[]>('/analytics/anomaly-checkins', {
      params: scheduleId ? { schedule_id: scheduleId } : {},
    }),
  getMetrics: (metricCode?: string) =>
    request.get<unknown, MetricDefinition[]>('/analytics/metrics', {
      params: metricCode ? { metric_code: metricCode } : {},
    }),
}
