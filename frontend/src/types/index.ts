export interface FunnelStage {
  stageName: string;
  stageOrder: number;
  complaintCount: number;
  avgDurationHours: number;
  dateRecorded: string;
}

export interface TimeoutInterval {
  startDate: string;
  endDate: string;
  avgDurationHours: number;
  affectedStages: string[];
}

export interface AnomalyFlag {
  id: string;
  complaintId: string;
  flagType: 'door_lock_delay' | 'payment_gap' | 'cs_message_change';
  description: string;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReviewNote {
  id: string;
  complaintId: string;
  anomalyFlagId?: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface SavedView {
  id: string;
  viewName: string;
  viewType: 'revisit_result' | 'responsibility' | 'problem_tag';
  filtersJson: string;
  createdBy: string;
  createdAt: string;
}

export interface SavedViewCreateData {
  viewName: string;
  viewType: SavedView['viewType'];
  filtersJson: string;
  createdBy: string;
}

export interface FunnelData {
  stages: FunnelStage[];
  timeoutIntervals: TimeoutInterval[];
}

export interface ClosureRule {
  ruleName: string;
  ruleDescription: string;
  formula: string;
}

export type DateRange = { start: string; end: string };

export interface AnomalyFetchParams {
  flagType?: AnomalyFlag['flagType'];
  severity?: AnomalyFlag['severity'];
  complaintId?: string;
}

export interface NoteCreateData {
  complaintId: string;
  anomalyFlagId?: string;
  content: string;
  author: string;
}

export interface NoteUpdateData {
  content?: string;
}
