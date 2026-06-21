import {
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	numeric,
	boolean,
	jsonb,
	date,
	primaryKey,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('user', {
	id: uuid('id').defaultRandom().primaryKey(),
	username: text('username').notNull().unique(),
	displayName: text('display_name'),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').default(false),
	hashedPassword: text('hashed_password'),
	avatarUrl: text('avatar_url'),
	role: text('role', { enum: ['admin', 'operator', 'finance', 'viewer'] }).default('viewer'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable('session', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const events = pgTable('event', {
	id: uuid('id').defaultRandom().primaryKey(),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category', { enum: ['concert', 'sports', 'exhibition', 'conference', 'other'] }),
	venue: text('venue'),
	startTime: timestamp('start_time', { withTimezone: true }),
	endTime: timestamp('end_time', { withTimezone: true }),
	posterUrl: text('poster_url'),
	status: text('status', {
		enum: ['draft', 'ready', 'selling', 'ended', 'cancelled']
	}).default('draft'),
	createdBy: uuid('created_by').references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const sponsors = pgTable('sponsor', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	contactPerson: text('contact_person'),
	contactPhone: text('contact_phone'),
	contactEmail: text('contact_email'),
	sponsorLevel: text('sponsor_level', { enum: ['title', 'gold', 'silver', 'bronze', 'other'] }),
	totalTickets: integer('total_tickets').default(0),
	totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0'),
	contractNo: text('contract_no'),
	agreementUrl: text('agreement_url'),
	notes: text('notes'),
	status: text('status', { enum: ['pending', 'confirmed', 'partial', 'completed'] }).default(
		'pending'
	),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
	return {
		eventIdx: index('sponsor_event_idx').on(table.eventId)
	};
});

export const sponsorTickets = pgTable('sponsor_ticket', {
	id: uuid('id').defaultRandom().primaryKey(),
	sponsorId: uuid('sponsor_id')
		.notNull()
		.references(() => sponsors.id, { onDelete: 'cascade' }),
	ticketTypeId: uuid('ticket_type_id'),
	quantity: integer('quantity').notNull(),
	unitValue: numeric('unit_value', { precision: 12, scale: 2 }).default('0'),
	deliveredDate: date('delivered_date'),
	receivedBy: uuid('received_by').references(() => users.id),
	deliveryNotes: text('delivery_notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const verifications = pgTable('verification', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	sourceType: text('source_type', {
		enum: ['sponsor', 'online_order', 'offline_order', 'member', 'comp']
	}).notNull(),
	sourceId: uuid('source_id'),
	serialNumber: text('serial_number').unique(),
	ticketTypeId: uuid('ticket_type_id'),
	seatId: uuid('seat_id'),
	holderName: text('holder_name'),
	holderPhone: text('holder_phone'),
	holderIdCard: text('holder_id_card'),
	status: text('status', {
		enum: ['issued', 'pending', 'verified', 'expired', 'refunded', 'cancelled']
	}).default('issued'),
	verifyTime: timestamp('verify_time', { withTimezone: true }),
	verifyChannel: text('verify_channel', { enum: ['gate', 'manual', 'online', 'self'] }),
	verifyOperatorId: uuid('verify_operator_id').references(() => users.id),
	verifyDevice: text('verify_device'),
	checkinCount: integer('checkin_count').default(0),
	lastCheckinAt: timestamp('last_checkin_at', { withTimezone: true }),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
	return {
		eventIdx: index('verification_event_idx').on(table.eventId),
		statusIdx: index('verification_status_idx').on(table.status),
		serialUidx: uniqueIndex('verification_serial_uidx').on(table.serialNumber)
	};
});

export const verificationLogs = pgTable('verification_log', {
	id: uuid('id').defaultRandom().primaryKey(),
	verificationId: uuid('verification_id')
		.notNull()
		.references(() => verifications.id, { onDelete: 'cascade' }),
	action: text('action').notNull(),
	oldStatus: text('old_status'),
	newStatus: text('new_status'),
	operatorId: uuid('operator_id').references(() => users.id),
	channel: text('channel'),
	deviceInfo: jsonb('device_info'),
	remark: text('remark'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
	return {
		verificationIdx: index('verification_log_vid_idx').on(table.verificationId)
	};
});

export const ticketTypes = pgTable('ticket_type', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	code: text('code').notNull(),
	name: text('name').notNull(),
	description: text('description'),
	category: text('category', {
		enum: ['vip', 'premium', 'standard', 'economy', 'standing', 'other']
	}),
	price: numeric('price', { precision: 12, scale: 2 }).default('0'),
	costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0'),
	totalQuota: integer('total_quota').default(0),
	soldQuota: integer('sold_quota').default(0),
	heldQuota: integer('held_quota').default(0),
	refundPolicy: text('refund_policy', {
		enum: ['non_refundable', 'partial_refund', 'full_refund_before_date']
	}).default('non_refundable'),
	refundDeadline: timestamp('refund_deadline', { withTimezone: true }),
	refundRate: numeric('refund_rate', { precision: 5, scale: 2 }).default('0'),
	transferAllowed: boolean('transfer_allowed').default(false),
	saleStartTime: timestamp('sale_start_time', { withTimezone: true }),
	saleEndTime: timestamp('sale_end_time', { withTimezone: true }),
	requiresSeat: boolean('requires_seat').default(true),
	seatZoneIds: jsonb('seat_zone_ids').$type<string[]>(),
	validationRules: jsonb('validation_rules').$type<Record<string, unknown>>(),
	status: text('status', { enum: ['active', 'inactive', 'sold_out'] }).default('active'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	unique(eventId, code)
});

export const orders = pgTable('order', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	orderNo: text('order_no').notNull().unique(),
	channel: text('channel', {
		enum: ['official_web', 'official_mini', 'official_app', 'third_party', 'offline', 'sponsor']
	}).notNull(),
	thirdPartySource: text('third_party_source'),
	buyerId: uuid('buyer_id'),
	buyerName: text('buyer_name'),
	buyerPhone: text('buyer_phone'),
	buyerEmail: text('buyer_email'),
	totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0'),
	totalQuantity: integer('total_quantity').default(0),
	discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
	paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }).default('0'),
	serviceFee: numeric('service_fee', { precision: 12, scale: 2 }).default('0'),
	paymentMethod: text('payment_method'),
	paymentStatus: text('payment_status', {
		enum: ['unpaid', 'pending', 'paid', 'partial_refund', 'refunded', 'failed']
	}).default('unpaid'),
	paymentTime: timestamp('payment_time', { withTimezone: true }),
	transactionId: text('transaction_id'),
	status: text('status', {
		enum: ['created', 'paid', 'issuing', 'issued', 'partial_refund', 'refunded', 'cancelled']
	}).default('created'),
	cancelReason: text('cancel_reason'),
	expireTime: timestamp('expire_time', { withTimezone: true }),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
	return {
		eventIdx: index('order_event_idx').on(table.eventId),
		statusIdx: index('order_status_idx').on(table.status)
	};
});

export const orderItems = pgTable('order_item', {
	id: uuid('id').defaultRandom().primaryKey(),
	orderId: uuid('order_id')
		.notNull()
		.references(() => orders.id, { onDelete: 'cascade' }),
	ticketTypeId: uuid('ticket_type_id').references(() => ticketTypes.id),
	seatId: uuid('seat_id'),
	quantity: integer('quantity').default(1),
	unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).default('0'),
	totalPrice: numeric('total_price', { precision: 12, scale: 2 }).default('0'),
	holderName: text('holder_name'),
	holderPhone: text('holder_phone'),
	holderIdCard: text('holder_id_card'),
	verificationId: uuid('verification_id').references(() => verifications.id),
	status: text('status', {
		enum: ['pending', 'issued', 'cancelled', 'refunded']
	}).default('pending'),
	refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }).default('0'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const seatMaps = pgTable('seat_map', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	layoutType: text('layout_type', {
		enum: ['theater', 'concert', 'arena', 'custom']
	}).default('theater'),
	rows: integer('rows').default(0),
	cols: integer('cols').default(0),
	totalSeats: integer('total_seats').default(0),
	zones: jsonb('zones').$type<
		Array<{
			id: string;
			name: string;
			priceTier?: string;
			rowRange?: [number, number];
			colRange?: [number, number];
			color?: string;
		}>
	>(),
	layoutConfig: jsonb('layout_config').$type<Record<string, unknown>>(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const seats = pgTable('seat', {
	id: uuid('id').defaultRandom().primaryKey(),
	seatMapId: uuid('seat_map_id')
		.notNull()
		.references(() => seatMaps.id, { onDelete: 'cascade' }),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	rowNo: text('row_no').notNull(),
	colNo: text('col_no').notNull(),
	seatNo: text('seat_no').notNull(),
	zoneId: text('zone_id'),
	category: text('category', {
		enum: ['vip', 'premium', 'standard', 'economy', 'standing', 'other']
	}),
	status: text('status', {
		enum: ['available', 'held', 'sold', 'reserved', 'disabled', 'not_for_sale']
	}).default('available'),
	heldByOrder: uuid('held_by_order').references(() => orders.id),
	ticketTypeId: uuid('ticket_type_id').references(() => ticketTypes.id),
	verificationId: uuid('verification_id').references(() => verifications.id),
	x: integer('x'),
	y: integer('y'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	unique(seatMapId, seatNo)
}, (table) => {
	return {
		seatMapIdx: index('seat_seatmap_idx').on(table.seatMapId),
		statusIdx: index('seat_status_idx').on(table.status)
	};
});

export const disputeTickets = pgTable('dispute_ticket', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	caseNo: text('case_no').notNull().unique(),
	type: text('type', {
		enum: ['refund_dispute', 'double_charge', 'fake_ticket', 'duplicate_verify', 'other']
	}).notNull(),
	sourceType: text('source_type', {
		enum: ['customer_complaint', 'audit_finding', 'operator_report', 'system_alarm']
	}),
	sourceId: uuid('source_id'),
	relatedOrderId: uuid('related_order_id').references(() => orders.id),
	relatedVerificationId: uuid('related_verification_id').references(() => verifications.id),
	relatedOrderItemIds: uuid('related_order_item_ids').array(),
	title: text('title').notNull(),
	description: text('description'),
	severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
	impactScope: jsonb('impact_scope').$type<{
		orderCount?: number;
		ticketCount?: number;
		involvedAmount?: string;
		affectedUsers?: string[];
		timeRange?: { start?: string; end?: string };
		seats?: string[];
	}>(),
	partyResponsible: text('party_responsible', {
		enum: ['buyer', 'operator', 'system', 'third_party', 'venue', 'undetermined']
	}),
	responsibilityDetail: text('responsibility_detail'),
	evidenceUrls: text('evidence_urls').array(),
	status: text('status', {
		enum: ['open', 'investigating', 'pending_approval', 'resolved', 'closed']
	}).default('open'),
	resolution: text('resolution', {
		enum: ['full_refund', 'partial_refund', 'compensation', 'ticket_reissue', 'denied', 'other']
	}),
	resolutionDetail: text('resolution_detail'),
	refundAmount: numeric('refund_amount', { precision: 12, scale: 2 }).default('0'),
	compensationAmount: numeric('compensation_amount', { precision: 12, scale: 2 }).default('0'),
	assignedTo: uuid('assigned_to').references(() => users.id),
	approverId: uuid('approver_id').references(() => users.id),
	approvedAt: timestamp('approved_at', { withTimezone: true }),
	resolvedAt: timestamp('resolved_at', { withTimezone: true }),
	closedAt: timestamp('closed_at', { withTimezone: true }),
	reportedBy: uuid('reported_by').references(() => users.id),
	reportedAt: timestamp('reported_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
	return {
		eventIdx: index('dispute_event_idx').on(table.eventId),
		statusIdx: index('dispute_status_idx').on(table.status)
	};
});

export const disputeMessages = pgTable('dispute_message', {
	id: uuid('id').defaultRandom().primaryKey(),
	disputeTicketId: uuid('dispute_ticket_id')
		.notNull()
		.references(() => disputeTickets.id, { onDelete: 'cascade' }),
	senderId: uuid('sender_id').references(() => users.id),
	senderType: text('sender_type', { enum: ['staff', 'system', 'customer'] }).default('staff'),
	content: text('content').notNull(),
	attachments: text('attachments').array(),
	isInternal: boolean('is_internal').default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const statusTransitions = pgTable('status_transition', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id').references(() => events.id),
	entityType: text('entity_type', {
		enum: ['order', 'order_item', 'verification', 'ticket_type', 'dispute', 'seat']
	}).notNull(),
	entityId: uuid('entity_id').notNull(),
	fromStatus: text('from_status'),
	toStatus: text('to_status').notNull(),
	transitionType: text('transition_type').notNull(),
	operatorId: uuid('operator_id').references(() => users.id),
	channel: text('channel'),
	triggerSource: text('trigger_source'),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	remark: text('remark'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
	return {
		entityIdx: index('status_transition_entity_idx').on(table.entityType, table.entityId),
		eventIdx: index('status_transition_event_idx').on(table.eventId)
	};
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type SponsorTicket = typeof sponsorTickets.$inferSelect;
export type NewSponsorTicket = typeof sponsorTickets.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type VerificationLog = typeof verificationLogs.$inferSelect;
export type NewVerificationLog = typeof verificationLogs.$inferInsert;
export type TicketType = typeof ticketTypes.$inferSelect;
export type NewTicketType = typeof ticketTypes.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type SeatMap = typeof seatMaps.$inferSelect;
export type NewSeatMap = typeof seatMaps.$inferInsert;
export type Seat = typeof seats.$inferSelect;
export type NewSeat = typeof seats.$inferInsert;
export type DisputeTicket = typeof disputeTickets.$inferSelect;
export type NewDisputeTicket = typeof disputeTickets.$inferInsert;
export type DisputeMessage = typeof disputeMessages.$inferSelect;
export type NewDisputeMessage = typeof disputeMessages.$inferInsert;
export type StatusTransition = typeof statusTransitions.$inferSelect;
export type NewStatusTransition = typeof statusTransitions.$inferInsert;
