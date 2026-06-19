export interface Complaint {
  id: string;
  order_id: string | null;
  platform_order_no: string | null;
  property_id: string;
  property_name: string;
  region: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'escalated' | 'resolved' | 'closed';
  description: string;
  created_at: string;
  assigned_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  handler: string;
  escalated: boolean;
  escalated_at: string | null;
  escalation_level: number;
  processing_time: number;
  target_time: number;
  is_overdue: boolean;
  callback_result: 'satisfied' | 'unsatisfied' | 'pending' | null;
  callback_note: string | null;
  responsibility: string | null;
  responsibility_dept: string | null;
}

export interface ComplaintDetail extends Complaint {
  logs: ComplaintLog[];
  callbacks: CallbackRecord[];
}

export interface ComplaintLog {
  id: string;
  complaint_id: string;
  action: string;
  operator: string;
  note: string;
  created_at: string;
}

export interface CallbackRecord {
  id: string;
  complaint_id: string;
  result: 'satisfied' | 'unsatisfied' | 'pending';
  note: string | null;
  operator: string;
  created_at: string;
}

export interface CallbackStats {
  result: string;
  count: number;
  percentage: number;
}

export interface SyncNode {
  id: string;
  name: string;
  source_type: 'door_lock' | 'payment' | 'ota';
  status: 'pending' | 'running' | 'success' | 'failed';
  seq_order: number;
  last_sync_time: string | null;
  success_count: number;
  fail_count: number;
  avg_duration: number;
  isLast?: boolean;
}

export interface SyncLog {
  id: string;
  node_id: string;
  batch_id: string;
  node_name: string;
  status: 'success' | 'failed';
  record_count: number;
  duration_ms: number;
  started_at: string;
  ended_at: string | null;
  error_detail: string | null;
  raw_data_sample: string | null;
}

export interface SyncFlow {
  sourceType: string;
  sourceTypeLabel: string;
  nodes: SyncNode[];
}

export interface SyncStats {
  sourceType: string;
  sourceTypeLabel: string;
  total_records: number;
  successRate: number;
}

export interface SyncBatch {
  id: string;
  source_type: string;
  started_at: string;
  ended_at: string | null;
  status: 'pending' | 'running' | 'success' | 'failed';
  total_count: number;
  success_count: number;
  fail_count: number;
}

export interface KPIData {
  totalComplaints: number;
  totalComplaintsYoY: number;
  newToday: number;
  overdueCount: number;
  overdueCountYoY: number;
  escalatedCount: number;
  escalatedCountYoY: number;
  resolvedCount: number;
  avgProcessingTime: number;
  avgProcessingTimeYoY: number;
  satisfactionRate: number;
  satisfactionRateYoY: number;
}

export interface OverdueWarning {
  id: string;
  property_name: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  processing_time: number;
  target_time: number;
}

export interface TrendData {
  dates: string[];
  counts: number[];
  prevCounts: number[];
  overdueCounts: number[];
  escalatedCounts: number[];
}

export interface HeatmapData {
  hours: string[];
  days: string[];
  heatmapData: [number, number, number][];
}

export interface EscalationTimelineData {
  dates: string[];
  level1: number[];
  level2: number[];
  level3: number[];
  totals: number[];
}

export interface DurationReport {
  regions: string[];
  lessThan1h: number[];
  between1_3h: number[];
  between3_12h: number[];
  between12_24h: number[];
  moreThan24h: number[];
  avgTimes: number[];
  rawData: Array<{
    region: string;
    total: number;
    less_than_1h: number;
    between_1_3h: number;
    between_3_12h: number;
    between_12_24h: number;
    more_than_24h: number;
    avg_time: number;
  }>;
}

export interface RegionReport {
  region: string;
  total: number;
  closed: number;
  closedRate: number;
  overdue: number;
  overdueRate: number;
  satisfactionRate: number;
  avgProcessingTime: number;
}

export interface DateReport {
  months: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
  rawData: Array<{
    month: string;
    region: string;
    total: number;
    overdue: number;
    escalated: number;
    avg_time: number;
  }>;
}

export interface ComparisonReport {
  period1: {
    start: string;
    end: string;
    total: number;
    closed: number;
    closedRate: number;
    overdue: number;
    overdueRate: number;
    escalated: number;
    avgProcessingTime: number;
    satisfactionRate: number;
  };
  period2: {
    start: string;
    end: string;
    total: number;
    closed: number;
    closedRate: number;
    overdue: number;
    overdueRate: number;
    escalated: number;
    avgProcessingTime: number;
    satisfactionRate: number;
  };
}

export interface PieDataItem {
  name: string;
  value: number;
}

export interface EscalationSeriesData {
  dates: string[];
  current: number[];
  compare: number[];
  levels: number[][];
}

export interface ReportSeries {
  name: string;
  data: number[];
}

export interface ReportData {
  dimension: string;
  categories: string[];
  series: ReportSeries[];
}

export interface DuckDBAnalysis {
  regionSummary: Array<{
    region: string;
    total: number;
    avg_time: number;
    overdue_count: number;
    escalated_count: number;
  }>;
  responsibilitySummary: Array<{
    responsibility_dept: string;
    count: number;
    percentage: number;
  }>;
}

export interface BarChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
    color?: string;
    type?: string;
  }>;
}

export interface PieChartDataItem {
  name: string;
  value: number;
}
