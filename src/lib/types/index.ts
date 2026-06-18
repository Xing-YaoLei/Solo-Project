export type UserRole = 'manager' | 'sales';

export interface User {
	id: string;
	name: string;
	role: UserRole;
	storeId?: string;
}

export type LeadStatus = 'appointed' | 'arrived' | 'completed' | 'no_show' | 'closed';

export interface TestDriveLead {
	id: string;
	customerName: string;
	phone: string;
	vehicleModel: string;
	salespersonId: string;
	salespersonName: string;
	appointmentTime: string;
	status: LeadStatus;
	financeApprovalId?: string;
	crmLeadId?: string;
	inspectionReportId?: string;
	noShowNote?: string;
	createdAt: string;
	importBatchId: string;
}

export interface FunnelStage {
	stage: 'leads' | 'appointments' | 'arrivals' | 'test_drives' | 'deals';
	label: string;
	count: number;
	conversionRate?: number;
}

export interface TimeSlotData {
	hour: number;
	dayOfWeek: number;
	count: number;
}

export interface TrendPoint {
	date: string;
	leadsCount: number;
	testDriveCount: number;
}

export interface RankingItem {
	rank: number;
	name: string;
	value: number;
	change?: number;
}

export type SourceType = 'finance' | 'crm' | 'inspection';
export type BatchStatus = 'processing' | 'merged' | 'failed';

export interface ImportBatch {
	id: string;
	name: string;
	sourceType: SourceType;
	status: BatchStatus;
	recordCount: number;
	mergedCount: number;
	createdAt: string;
	createdBy: string;
}

export interface OverviewMetrics {
	totalLeads: number;
	totalAppointments: number;
	arrivalCount: number;
	testDriveCount: number;
	conversionRate: number;
	noShowCount: number;
	noShowRate: number;
}
