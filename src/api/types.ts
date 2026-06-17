export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ExportTriggerRequest {
  export_type: string;
  filters?: Record<string, any>;
  include_caliber: boolean;
  dimensions: string[];
  date_range?: { start: string; end: string };
  format: string;
}

export interface ExportStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path?: string;
  error_message?: string;
  row_count?: number;
}

export interface ExceptionCreateRequest {
  prescription_id: string;
  exception_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact_scope: string;
  description?: string;
  assignee_id?: string;
}

export interface ExceptionUpdateRequest {
  resolution?: string;
  status?: 'open' | 'processing' | 'resolved' | 'closed';
  assignee_id?: string;
  impact_scope?: string;
  description?: string;
}

export interface CaliberNote {
  id: string;
  metric: string;
  definition: string;
  exclusions: string[];
  remarks?: string;
  created_at: string;
}
