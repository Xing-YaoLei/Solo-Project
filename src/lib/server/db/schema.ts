import { pgTable, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { sql, relations, type InferSelectModel } from 'drizzle-orm';

const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'cleaner', 'viewer']);
const propertyTypeEnum = pgEnum('property_type', ['apartment', 'house', 'villa', 'room']);
const propertyStatusEnum = pgEnum('property_status', ['active', 'maintenance', 'inactive']);
const bookingSourceEnum = pgEnum('booking_source', ['airbnb', 'tujia', 'xiaozhu', 'meituan', 'direct', 'other']);
const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'checked_in', 'checked_out', 'cancelled']);
const idTypeEnum = pgEnum('id_type', ['id_card', 'passport', 'driver_license', 'other']);
const taskTypeEnum = pgEnum('task_type', ['checkout_cleaning', 'periodic_cleaning', 'deep_cleaning', 'maintenance']);
const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
const taskStatusEnum = pgEnum('task_status', ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'verified', 'cancelled', 'missed']);
const complaintSeverityEnum = pgEnum('complaint_severity', ['low', 'medium', 'high', 'critical']);
const complaintSourceEnum = pgEnum('complaint_source', ['guest', 'platform_review', 'owner', 'inspection', 'other']);
const complaintStatusEnum = pgEnum('complaint_status', ['open', 'investigating', 'resolved', 'closed']);
const anomalyTypeEnum = pgEnum('anomaly_type', ['missed_cleaning', 'late_cleaning', 'quality_issue', 'no_show', 'other']);
const anomalyImpactLevelEnum = pgEnum('anomaly_impact_level', ['low', 'medium', 'high', 'critical']);
const anomalyStatusEnum = pgEnum('anomaly_status', ['pending', 'handling', 'resolved', 'closed']);
const calendarEventTypeEnum = pgEnum('calendar_event_type', ['booking', 'cleaning', 'maintenance', 'other']);

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	realName: text('real_name').notNull(),
	passwordHash: text('password_hash'),
	email: text('email').unique(),
	phone: text('phone'),
	role: userRoleEnum('role').notNull().default('viewer'),
	avatarUrl: text('avatar_url'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => userTable.id),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const propertyTable = pgTable('property', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	address: text('address').notNull(),
	type: propertyTypeEnum('type').notNull().default('apartment'),
	bedrooms: integer('bedrooms').notNull().default(1),
	bathrooms: integer('bathrooms').notNull().default(1),
	area: integer('area'),
	phone: text('phone'),
	ownerName: text('owner_name'),
	ownerPhone: text('owner_phone'),
	description: text('description'),
	images: text('images').array(),
	status: propertyStatusEnum('status').notNull().default('active'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
	createdById: text('created_by_id').references(() => userTable.id)
});

export const bookingTable = pgTable('booking', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	guestName: text('guest_name').notNull(),
	guestPhone: text('guest_phone').notNull(),
	checkInDate: timestamp('check_in_date', { withTimezone: true }).notNull(),
	checkOutDate: timestamp('check_out_date', { withTimezone: true }).notNull(),
	adults: integer('adults').notNull().default(1),
	children: integer('children').notNull().default(0),
	source: bookingSourceEnum('source').notNull().default('other'),
	totalPrice: integer('total_price'),
	status: bookingStatusEnum('status').notNull().default('confirmed'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const guestDocumentTable = pgTable('guest_document', {
	id: text('id').primaryKey(),
	bookingId: text('booking_id').notNull().references(() => bookingTable.id),
	guestName: text('guest_name').notNull(),
	idType: idTypeEnum('id_type').notNull().default('id_card'),
	idNumber: text('id_number').notNull(),
	idFrontUrl: text('id_front_url'),
	idBackUrl: text('id_back_url'),
	verifiedAt: timestamp('verified_at', { withTimezone: true }),
	verifiedById: text('verified_by_id').references(() => userTable.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const cleaningTaskTable = pgTable('cleaning_task', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	bookingId: text('booking_id').references(() => bookingTable.id),
	assignedCleanerId: text('assigned_cleaner_id').references(() => userTable.id),
	scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
	scheduledStartTime: text('scheduled_start_time'),
	deadlineTime: timestamp('deadline_time', { withTimezone: true }),
	type: taskTypeEnum('type').notNull().default('checkout_cleaning'),
	priority: taskPriorityEnum('priority').notNull().default('medium'),
	description: text('description'),
	checklist: text('checklist').array(),
	status: taskStatusEnum('status').notNull().default('pending'),
	actualStartTime: timestamp('actual_start_time', { withTimezone: true }),
	actualEndTime: timestamp('actual_end_time', { withTimezone: true }),
	verifiedAt: timestamp('verified_at', { withTimezone: true }),
	verifiedById: text('verified_by_id').references(() => userTable.id),
	qualityScore: integer('quality_score'),
	photos: text('photos').array(),
	cleanerNotes: text('cleaner_notes'),
	inspectorNotes: text('inspector_notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
	createdById: text('created_by_id').references(() => userTable.id)
});

export const taskStatusHistoryTable = pgTable('task_status_history', {
	id: text('id').primaryKey(),
	taskId: text('task_id').notNull().references(() => cleaningTaskTable.id),
	fromStatus: taskStatusEnum('from_status'),
	toStatus: taskStatusEnum('to_status').notNull(),
	reason: text('reason'),
	changedById: text('changed_by_id').references(() => userTable.id),
	changedAt: timestamp('changed_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const complaintTable = pgTable('complaint', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	bookingId: text('booking_id').references(() => bookingTable.id),
	taskId: text('task_id').references(() => cleaningTaskTable.id),
	title: text('title').notNull(),
	content: text('content').notNull(),
	severity: complaintSeverityEnum('severity').notNull().default('medium'),
	source: complaintSourceEnum('source').notNull().default('guest'),
	status: complaintStatusEnum('status').notNull().default('open'),
	tags: text('tags').array(),
	evidenceUrls: text('evidence_urls').array(),
	reviewRating: integer('review_rating'),
	reviewPlatform: text('review_platform'),
	reviewLink: text('review_link'),
	responsibleCleanerId: text('responsible_cleaner_id').references(() => userTable.id),
	handlerId: text('handler_id').references(() => userTable.id),
	resolution: text('resolution'),
	compensation: integer('compensation'),
	filedAt: timestamp('filed_at', { withTimezone: true }).notNull().default(sql`now()`),
	resolvedAt: timestamp('resolved_at', { withTimezone: true }),
	closedAt: timestamp('closed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const anomalyTable = pgTable('anomaly', {
	id: text('id').primaryKey(),
	taskId: text('task_id').notNull().references(() => cleaningTaskTable.id),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	type: anomalyTypeEnum('type').notNull().default('missed_cleaning'),
	title: text('title').notNull(),
	description: text('description').notNull(),
	impactScope: text('impact_scope').notNull(),
	impactedBookings: text('impacted_bookings').array(),
	impactLevel: anomalyImpactLevelEnum('impact_level').notNull().default('medium'),
	responsiblePersonId: text('responsible_person_id').references(() => userTable.id),
	responsibleRole: text('responsible_role'),
	discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull().default(sql`now()`),
	discoveredById: text('discovered_by_id').references(() => userTable.id),
	status: anomalyStatusEnum('status').notNull().default('pending'),
	handlingMeasures: text('handling_measures'),
	handlingResult: text('handling_result'),
	handlingConclusion: text('handling_conclusion'),
	handledById: text('handled_by_id').references(() => userTable.id),
	handledAt: timestamp('handled_at', { withTimezone: true }),
	closedAt: timestamp('closed_at', { withTimezone: true }),
	penalty: text('penalty'),
	compensation: integer('compensation'),
	followUpRequired: boolean('follow_up_required').notNull().default(false),
	followUpNotes: text('follow_up_notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const calendarEventTable = pgTable('calendar_event', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	title: text('title').notNull(),
	type: calendarEventTypeEnum('type').notNull(),
	referenceId: text('reference_id'),
	startDate: timestamp('start_date', { withTimezone: true }).notNull(),
	endDate: timestamp('end_date', { withTimezone: true }).notNull(),
	isAllDay: boolean('is_all_day').notNull().default(true),
	color: text('color'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`)
});

export const userRelations = relations(userTable, ({ many }) => ({
	assignedTasks: many(cleaningTaskTable, { relationName: 'assignedCleaner' }),
	verifiedTasks: many(cleaningTaskTable, { relationName: 'verifier' }),
	createdTasks: many(cleaningTaskTable, { relationName: 'creator' }),
	filedComplaints: many(complaintTable, { relationName: 'responsibleCleaner' }),
	handledComplaints: many(complaintTable, { relationName: 'handler' }),
	anomaliesResponsible: many(anomalyTable, { relationName: 'responsiblePerson' }),
	anomaliesDiscovered: many(anomalyTable, { relationName: 'discoverer' }),
	anomaliesHandled: many(anomalyTable, { relationName: 'handler' })
}));

export const propertyRelations = relations(propertyTable, ({ many }) => ({
	bookings: many(bookingTable),
	tasks: many(cleaningTaskTable),
	complaints: many(complaintTable),
	anomalies: many(anomalyTable),
	calendarEvents: many(calendarEventTable)
}));

export const bookingRelations = relations(bookingTable, ({ one, many }) => ({
	property: one(propertyTable, {
		fields: [bookingTable.propertyId],
		references: [propertyTable.id]
	}),
	documents: many(guestDocumentTable),
	tasks: many(cleaningTaskTable),
	complaints: many(complaintTable)
}));

export const cleaningTaskRelations = relations(cleaningTaskTable, ({ one, many }) => ({
	property: one(propertyTable, {
		fields: [cleaningTaskTable.propertyId],
		references: [propertyTable.id]
	}),
	booking: one(bookingTable, {
		fields: [cleaningTaskTable.bookingId],
		references: [bookingTable.id]
	}),
	assignedCleaner: one(userTable, {
		fields: [cleaningTaskTable.assignedCleanerId],
		references: [userTable.id],
		relationName: 'assignedCleaner'
	}),
	verifier: one(userTable, {
		fields: [cleaningTaskTable.verifiedById],
		references: [userTable.id],
		relationName: 'verifier'
	}),
	creator: one(userTable, {
		fields: [cleaningTaskTable.createdById],
		references: [userTable.id],
		relationName: 'creator'
	}),
	statusHistory: many(taskStatusHistoryTable),
	complaints: many(complaintTable),
	anomalies: many(anomalyTable)
}));

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
export type Property = InferSelectModel<typeof propertyTable>;
export type Booking = InferSelectModel<typeof bookingTable>;
export type GuestDocument = InferSelectModel<typeof guestDocumentTable>;
export type CleaningTask = InferSelectModel<typeof cleaningTaskTable>;
export type TaskStatusHistory = InferSelectModel<typeof taskStatusHistoryTable>;
export type Complaint = InferSelectModel<typeof complaintTable>;
export type Anomaly = InferSelectModel<typeof anomalyTable>;
export type CalendarEvent = InferSelectModel<typeof calendarEventTable>;
