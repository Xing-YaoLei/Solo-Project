import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql, relations, type InferSelectModel } from 'drizzle-orm';

export const userTable = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	realName: text('real_name').notNull(),
	passwordHash: text('password_hash'),
	email: text('email').unique(),
	phone: text('phone'),
	role: text('role', { enum: ['admin', 'manager', 'cleaner', 'viewer'] }).notNull().default('viewer'),
	avatarUrl: text('avatar_url'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`)
});

export const sessionTable = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => userTable.id),
	expiresAt: integer('expires_at').notNull()
});

export const propertyTable = sqliteTable('property', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	address: text('address').notNull(),
	type: text('type', { enum: ['apartment', 'house', 'villa', 'room'] }).notNull().default('apartment'),
	bedrooms: integer('bedrooms').notNull().default(1),
	bathrooms: integer('bathrooms').notNull().default(1),
	area: integer('area'),
	phone: text('phone'),
	ownerName: text('owner_name'),
	ownerPhone: text('owner_phone'),
	description: text('description'),
	images: text('images').$type<string[]>(),
	status: text('status', { enum: ['active', 'maintenance', 'inactive'] }).notNull().default('active'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
	createdById: text('created_by_id').references(() => userTable.id)
});

export const bookingTable = sqliteTable('booking', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	guestName: text('guest_name').notNull(),
	guestPhone: text('guest_phone').notNull(),
	checkInDate: integer('check_in_date').notNull(),
	checkOutDate: integer('check_out_date').notNull(),
	adults: integer('adults').notNull().default(1),
	children: integer('children').notNull().default(0),
	source: text('source', { enum: ['airbnb', 'tujia', 'xiaozhu', 'meituan', 'direct', 'other'] }).notNull().default('other'),
	totalPrice: integer('total_price'),
	status: text('status', { enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled'] }).notNull().default('confirmed'),
	notes: text('notes'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`)
});

export const guestDocumentTable = sqliteTable('guest_document', {
	id: text('id').primaryKey(),
	bookingId: text('booking_id').notNull().references(() => bookingTable.id),
	guestName: text('guest_name').notNull(),
	idType: text('id_type', { enum: ['id_card', 'passport', 'driver_license', 'other'] }).notNull().default('id_card'),
	idNumber: text('id_number').notNull(),
	idFrontUrl: text('id_front_url'),
	idBackUrl: text('id_back_url'),
	verifiedAt: integer('verified_at'),
	verifiedById: text('verified_by_id').references(() => userTable.id),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`)
});

export const cleaningTaskTable = sqliteTable('cleaning_task', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	bookingId: text('booking_id').references(() => bookingTable.id),
	assignedCleanerId: text('assigned_cleaner_id').references(() => userTable.id),
	scheduledDate: integer('scheduled_date').notNull(),
	scheduledStartTime: text('scheduled_start_time'),
	deadlineTime: integer('deadline_time'),
	type: text('type', { enum: ['checkout_cleaning', 'periodic_cleaning', 'deep_cleaning', 'maintenance'] }).notNull().default('checkout_cleaning'),
	priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
	description: text('description'),
	checklist: text('checklist').$type<string[]>(),
	status: text('status', {
		enum: ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'verified', 'cancelled', 'missed']
	}).notNull().default('pending'),
	actualStartTime: integer('actual_start_time'),
	actualEndTime: integer('actual_end_time'),
	verifiedAt: integer('verified_at'),
	verifiedById: text('verified_by_id').references(() => userTable.id),
	qualityScore: integer('quality_score'),
	photos: text('photos').$type<string[]>(),
	cleanerNotes: text('cleaner_notes'),
	inspectorNotes: text('inspector_notes'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`),
	createdById: text('created_by_id').references(() => userTable.id)
});

export const taskStatusHistoryTable = sqliteTable('task_status_history', {
	id: text('id').primaryKey(),
	taskId: text('task_id').notNull().references(() => cleaningTaskTable.id),
	fromStatus: text('from_status'),
	toStatus: text('to_status').notNull(),
	reason: text('reason'),
	changedById: text('changed_by_id').references(() => userTable.id),
	changedAt: integer('changed_at').notNull().default(sql`(unixepoch() * 1000)`)
});

export const complaintTable = sqliteTable('complaint', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	bookingId: text('booking_id').references(() => bookingTable.id),
	taskId: text('task_id').references(() => cleaningTaskTable.id),
	title: text('title').notNull(),
	content: text('content').notNull(),
	severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
	source: text('source', { enum: ['guest', 'platform_review', 'owner', 'inspection', 'other'] }).notNull().default('guest'),
	status: text('status', { enum: ['open', 'investigating', 'resolved', 'closed'] }).notNull().default('open'),
	tags: text('tags').$type<string[]>(),
	evidenceUrls: text('evidence_urls').$type<string[]>(),
	reviewRating: integer('review_rating'),
	reviewPlatform: text('review_platform'),
	reviewLink: text('review_link'),
	responsibleCleanerId: text('responsible_cleaner_id').references(() => userTable.id),
	handlerId: text('handler_id').references(() => userTable.id),
	resolution: text('resolution'),
	compensation: integer('compensation'),
	filedAt: integer('filed_at').notNull().default(sql`(unixepoch() * 1000)`),
	resolvedAt: integer('resolved_at'),
	closedAt: integer('closed_at'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`)
});

export const anomalyTable = sqliteTable('anomaly', {
	id: text('id').primaryKey(),
	taskId: text('task_id').notNull().references(() => cleaningTaskTable.id),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	type: text('type', { enum: ['missed_cleaning', 'late_cleaning', 'quality_issue', 'no_show', 'other'] }).notNull().default('missed_cleaning'),
	title: text('title').notNull(),
	description: text('description').notNull(),
	impactScope: text('impact_scope').notNull(),
	impactedBookings: text('impacted_bookings').$type<string[]>(),
	impactLevel: text('impact_level', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
	responsiblePersonId: text('responsible_person_id').references(() => userTable.id),
	responsibleRole: text('responsible_role'),
	discoveredAt: integer('discovered_at').notNull().default(sql`(unixepoch() * 1000)`),
	discoveredById: text('discovered_by_id').references(() => userTable.id),
	status: text('status', { enum: ['pending', 'handling', 'resolved', 'closed'] }).notNull().default('pending'),
	handlingMeasures: text('handling_measures'),
	handlingResult: text('handling_result'),
	handlingConclusion: text('handling_conclusion'),
	handledById: text('handled_by_id').references(() => userTable.id),
	handledAt: integer('handled_at'),
	closedAt: integer('closed_at'),
	penalty: text('penalty'),
	compensation: integer('compensation'),
	followUpRequired: integer('follow_up_required').notNull().default(0),
	followUpNotes: text('follow_up_notes'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`)
});

export const calendarEventTable = sqliteTable('calendar_event', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => propertyTable.id),
	title: text('title').notNull(),
	type: text('type', { enum: ['booking', 'cleaning', 'maintenance', 'other'] }).notNull(),
	referenceId: text('reference_id'),
	startDate: integer('start_date').notNull(),
	endDate: integer('end_date').notNull(),
	isAllDay: integer('is_all_day').notNull().default(1),
	color: text('color'),
	notes: text('notes'),
	createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer('updated_at').notNull().default(sql`(unixepoch() * 1000)`)
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
