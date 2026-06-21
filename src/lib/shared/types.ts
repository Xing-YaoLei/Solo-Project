export type UserRole = 'admin' | 'operator' | 'finance' | 'viewer';

export type EventCategory = 'concert' | 'sports' | 'exhibition' | 'conference' | 'other';
export type EventStatus = 'draft' | 'ready' | 'selling' | 'ended' | 'cancelled';

export type SponsorLevel = 'title' | 'gold' | 'silver' | 'bronze' | 'other';
export type SponsorStatus = 'pending' | 'confirmed' | 'partial' | 'completed';

export type VerificationSourceType =
	| 'sponsor'
	| 'online_order'
	| 'offline_order'
	| 'member'
	| 'comp';
export type VerificationStatus =
	| 'issued'
	| 'pending'
	| 'verified'
	| 'expired'
	| 'refunded'
	| 'cancelled';
export type VerifyChannel = 'gate' | 'manual' | 'online' | 'self';

export type TicketCategory =
	| 'vip'
	| 'premium'
	| 'standard'
	| 'economy'
	| 'standing'
	| 'other';
export type RefundPolicy = 'non_refundable' | 'partial_refund' | 'full_refund_before_date';
export type TicketTypeStatus = 'active' | 'inactive' | 'sold_out';

export type OrderChannel =
	| 'official_web'
	| 'official_mini'
	| 'official_app'
	| 'third_party'
	| 'offline'
	| 'sponsor';
export type PaymentStatus =
	| 'unpaid'
	| 'pending'
	| 'paid'
	| 'partial_refund'
	| 'refunded'
	| 'failed';
export type OrderStatus =
	| 'created'
	| 'paid'
	| 'issuing'
	| 'issued'
	| 'partial_refund'
	| 'refunded'
	| 'cancelled';
export type OrderItemStatus = 'pending' | 'issued' | 'cancelled' | 'refunded';

export type LayoutType = 'theater' | 'concert' | 'arena' | 'custom';
export type SeatStatus =
	| 'available'
	| 'held'
	| 'sold'
	| 'reserved'
	| 'disabled'
	| 'not_for_sale';

export type DisputeType =
	| 'refund_dispute'
	| 'double_charge'
	| 'fake_ticket'
	| 'duplicate_verify'
	| 'other';
export type DisputeSourceType =
	| 'customer_complaint'
	| 'audit_finding'
	| 'operator_report'
	| 'system_alarm';
export type DisputeSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ResponsibleParty =
	| 'buyer'
	| 'operator'
	| 'system'
	| 'third_party'
	| 'venue'
	| 'undetermined';
export type DisputeStatus =
	| 'open'
	| 'investigating'
	| 'pending_approval'
	| 'resolved'
	| 'closed';
export type DisputeResolution =
	| 'full_refund'
	| 'partial_refund'
	| 'compensation'
	| 'ticket_reissue'
	| 'denied'
	| 'other';

export type EntityType =
	| 'order'
	| 'order_item'
	| 'verification'
	| 'ticket_type'
	| 'dispute'
	| 'seat';

export interface SeatZone {
	id: string;
	name: string;
	priceTier?: string;
	rowRange?: [number, number];
	colRange?: [number, number];
	color?: string;
}

export interface ImpactScope {
	orderCount?: number;
	ticketCount?: number;
	involvedAmount?: string;
	affectedUsers?: string[];
	timeRange?: { start?: string; end?: string };
	seats?: string[];
}

export interface PaginationInput {
	page?: number;
	pageSize?: number;
}

export interface PaginationOutput<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface DateRangeFilter {
	startDate?: string;
	endDate?: string;
}

export interface ExportOptions {
	format: 'csv' | 'excel' | 'json';
	caliber: string;
	includeMetadata?: boolean;
}

export interface ExportCaliber {
	scope: string;
	timeRange?: DateRangeFilter;
	filters: Record<string, unknown>;
	aggregationRules: string[];
	calculatedAt: string;
	operator: string;
}
