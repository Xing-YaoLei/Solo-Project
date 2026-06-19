import {
	pgTable,
	text,
	integer,
	real,
	primaryKey,
	index,
	timestamp,
	boolean,
	jsonb
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	username: text('username').notNull(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'manager', 'staff'] }).notNull().default('staff'),
	avatar: text('avatar'),
	phone: text('phone'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	orders: many(order),
	cleaningTasksAssigned: many(cleaningTask, { relationName: 'assignedCleaner' }),
	exceptionsCreated: many(exceptionOrder, { relationName: 'creator' }),
	exceptionsAssigned: many(exceptionOrder, { relationName: 'owner' }),
	auditLogs: many(auditLog),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export type RoomStatus = 'available' | 'booked' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked';

export const property = pgTable('property', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	address: text('address').notNull(),
	city: text('city').notNull(),
	type: text('type', { enum: ['apartment', 'house', 'villa', 'loft', 'other'] }).notNull(),
	bedrooms: integer('bedrooms').notNull().default(1),
	bathrooms: integer('bathrooms').notNull().default(1),
	maxGuests: integer('max_guests').notNull().default(2),
	area: real('area'),
	basePrice: real('base_price').notNull().default(0),
	cleaningFee: real('cleaning_fee').notNull().default(0),
	depositAmount: real('deposit_amount').notNull().default(0),
	amenities: jsonb('amenities').$type<string[]>(),
	images: jsonb('images').$type<string[]>(),
	description: text('description'),
	status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roomCalendar = pgTable('room_calendar', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => property.id, { onDelete: 'cascade' }),
	date: timestamp('date', { withTimezone: true }).notNull(),
	status: text('status', { enum: ['available', 'booked', 'occupied', 'cleaning', 'maintenance', 'blocked'] }).notNull().default('available'),
	orderId: text('order_id').references(() => order.id),
	price: real('price'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	propertyDateIdx: index('property_date_idx').on(table.propertyId, table.date),
}));

export const propertyRelations = relations(property, ({ many }) => ({
	calendars: many(roomCalendar),
	orders: many(order),
	cleaningTasks: many(cleaningTask),
	guestRegistrations: many(guestRegistration),
	deposits: many(deposit),
}));

export const roomCalendarRelations = relations(roomCalendar, ({ one }) => ({
	property: one(property, { fields: [roomCalendar.propertyId], references: [property.id] }),
	order: one(order, { fields: [roomCalendar.orderId], references: [order.id] }),
}));

export type ChannelType = 'airbnb' | 'booking' | 'tujia' | 'meituan' | 'xiaohongshu' | 'direct' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export const order = pgTable('order', {
	id: text('id').primaryKey(),
	orderNo: text('order_no').notNull().unique(),
	propertyId: text('property_id').notNull().references(() => property.id, { onDelete: 'cascade' }),
	channel: text('channel', { enum: ['airbnb', 'booking', 'tujia', 'meituan', 'xiaohongshu', 'direct', 'other'] }).notNull().default('direct'),
	channelOrderNo: text('channel_order_no'),
	guestName: text('guest_name').notNull(),
	guestPhone: text('guest_phone').notNull(),
	guestEmail: text('guest_email'),
	guestCount: integer('guest_count').notNull().default(1),
	checkInDate: timestamp('check_in_date', { withTimezone: true }).notNull(),
	checkOutDate: timestamp('check_out_date', { withTimezone: true }).notNull(),
	nightCount: integer('night_count').notNull().default(1),
	totalPrice: real('total_price').notNull().default(0),
	cleaningFee: real('cleaning_fee').notNull().default(0),
	depositAmount: real('deposit_amount').notNull().default(0),
	channelFee: real('channel_fee').notNull().default(0),
	status: text('status', { enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'] }).notNull().default('pending'),
	paymentStatus: text('payment_status', { enum: ['unpaid', 'partial', 'paid', 'refunded'] }).notNull().default('unpaid'),
	paidAmount: real('paid_amount').notNull().default(0),
	source: text('source', { enum: ['online', 'offline'] }).notNull().default('online'),
	contactPerson: text('contact_person'),
	contactPhone: text('contact_phone'),
	remark: text('remark'),
	internalNote: text('internal_note'),
	createdBy: text('created_by').references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderRelations = relations(order, ({ one, many }) => ({
	property: one(property, { fields: [order.propertyId], references: [property.id] }),
	creator: one(user, { fields: [order.createdBy], references: [user.id] }),
	calendars: many(roomCalendar),
	cleaningTasks: many(cleaningTask),
	guestRegistrations: many(guestRegistration),
	deposits: many(deposit),
	exceptions: many(exceptionOrder),
}));

export type CleaningStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type CleaningPriority = 'low' | 'medium' | 'high' | 'urgent';

export const cleaningTask = pgTable('cleaning_task', {
	id: text('id').primaryKey(),
	taskNo: text('task_no').notNull().unique(),
	propertyId: text('property_id').notNull().references(() => property.id, { onDelete: 'cascade' }),
	orderId: text('order_id').references(() => order.id),
	type: text('type', { enum: ['checkout', 'periodic', 'deep', 'maintenance', 'other'] }).notNull().default('checkout'),
	status: text('status', { enum: ['pending', 'in_progress', 'completed', 'cancelled', 'rejected'] }).notNull().default('pending'),
	priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
	scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
	scheduledTime: text('scheduled_time'),
	actualStart: timestamp('actual_start', { withTimezone: true }),
	actualEnd: timestamp('actual_end', { withTimezone: true }),
	assignedTo: text('assigned_to').references(() => user.id),
	fee: real('fee').notNull().default(0),
	items: jsonb('items').$type<{ name: string; done: boolean }[]>(),
	beforePhotos: jsonb('before_photos').$type<string[]>(),
	afterPhotos: jsonb('after_photos').$type<string[]>(),
	checklist: jsonb('checklist').$type<{ name: string; done: boolean; remark?: string }[]>(),
	inspectorNote: text('inspector_note'),
	cleanerNote: text('cleaner_note'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cleaningTaskRelations = relations(cleaningTask, ({ one }) => ({
	property: one(property, { fields: [cleaningTask.propertyId], references: [property.id] }),
	order: one(order, { fields: [cleaningTask.orderId], references: [order.id] }),
	assignee: one(user, { fields: [cleaningTask.assignedTo], references: [user.id], relationName: 'assignedCleaner' }),
}));

export type IDType = 'id_card' | 'passport' | 'driver_license' | 'other';

export const guestRegistration = pgTable('guest_registration', {
	id: text('id').primaryKey(),
	propertyId: text('property_id').notNull().references(() => property.id, { onDelete: 'cascade' }),
	orderId: text('order_id').references(() => order.id),
	fullName: text('full_name').notNull(),
	idType: text('id_type', { enum: ['id_card', 'passport', 'driver_license', 'other'] }).notNull().default('id_card'),
	idNumber: text('id_number').notNull(),
	nationality: text('nationality').default('CN'),
	gender: text('gender', { enum: ['male', 'female', 'other'] }),
	birthDate: timestamp('birth_date', { withTimezone: true }),
	address: text('address'),
	phone: text('phone'),
	idFrontPhoto: text('id_front_photo'),
	idBackPhoto: text('id_back_photo'),
	facePhoto: text('face_photo'),
	isPrimary: boolean('is_primary').notNull().default(false),
	checkInAt: timestamp('check_in_at', { withTimezone: true }),
	checkOutAt: timestamp('check_out_at', { withTimezone: true }),
	remark: text('remark'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const guestRegistrationRelations = relations(guestRegistration, ({ one }) => ({
	property: one(property, { fields: [guestRegistration.propertyId], references: [property.id] }),
	order: one(order, { fields: [guestRegistration.orderId], references: [order.id] }),
}));

export type DepositStatus = 'collected' | 'frozen' | 'refunded' | 'partial_refunded' | 'deducted';

export const deposit = pgTable('deposit', {
	id: text('id').primaryKey(),
	depositNo: text('deposit_no').notNull().unique(),
	propertyId: text('property_id').notNull().references(() => property.id, { onDelete: 'cascade' }),
	orderId: text('order_id').references(() => order.id),
	guestName: text('guest_name').notNull(),
	amount: real('amount').notNull().default(0),
	status: text('status', { enum: ['collected', 'frozen', 'refunded', 'partial_refunded', 'deducted'] }).notNull().default('collected'),
	paymentMethod: text('payment_method', { enum: ['cash', 'wechat', 'alipay', 'bank_transfer', 'card', 'platform'] }).notNull().default('wechat'),
	transactionNo: text('transaction_no'),
	collectedAt: timestamp('collected_at', { withTimezone: true }),
	refundedAmount: real('refunded_amount').notNull().default(0),
	deductedAmount: real('deducted_amount').notNull().default(0),
	deductionItems: jsonb('deduction_items').$type<{ name: string; amount: number; remark?: string }[]>(),
	refundMethod: text('refund_method', { enum: ['cash', 'wechat', 'alipay', 'bank_transfer', 'card', 'platform'] }),
	refundTransactionNo: text('refund_transaction_no'),
	refundedAt: timestamp('refunded_at', { withTimezone: true }),
	photos: jsonb('photos').$type<string[]>(),
	remark: text('remark'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const depositRelations = relations(deposit, ({ one }) => ({
	property: one(property, { fields: [deposit.propertyId], references: [property.id] }),
	order: one(order, { fields: [deposit.orderId], references: [order.id] }),
}));

export type ExceptionType = 'status_conflict' | 'double_booking' | 'overbooking' | 'cleaning_delay' | 'amenity_issue' | 'guest_complaint' | 'other';
export type ExceptionStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export const exceptionOrder = pgTable('exception_order', {
	id: text('id').primaryKey(),
	exceptionNo: text('exception_no').notNull().unique(),
	type: text('type', { enum: ['status_conflict', 'double_booking', 'overbooking', 'cleaning_delay', 'amenity_issue', 'guest_complaint', 'other'] }).notNull().default('status_conflict'),
	status: text('status', { enum: ['open', 'investigating', 'resolved', 'closed'] }).notNull().default('open'),
	severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
	title: text('title').notNull(),
	description: text('description').notNull(),
	propertyId: text('property_id').references(() => property.id),
	orderId: text('order_id').references(() => order.id),
	conflictingOrderId: text('conflicting_order_id').references(() => order.id),
	affectedStartDate: timestamp('affected_start_date', { withTimezone: true }),
	affectedEndDate: timestamp('affected_end_date', { withTimezone: true }),
	affectedNights: integer('affected_nights').default(0),
	impactScope: text('impact_scope'),
	rootCause: text('root_cause'),
	resolution: text('resolution'),
	ownerId: text('owner_id').references(() => user.id),
	responderId: text('responder_id').references(() => user.id),
	financialImpact: real('financial_impact').default(0),
	compensationAmount: real('compensation_amount').default(0),
	evidence: jsonb('evidence').$type<string[]>(),
	conclusion: text('conclusion'),
	createdBy: text('created_by').notNull().references(() => user.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	resolvedAt: timestamp('resolved_at', { withTimezone: true }),
	closedAt: timestamp('closed_at', { withTimezone: true }),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exceptionResponsible = pgTable('exception_responsible', {
	id: text('id').primaryKey(),
	exceptionId: text('exception_id').notNull().references(() => exceptionOrder.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => user.id),
	role: text('role').notNull(),
	responsibilityDescription: text('responsibility_description'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	pk: primaryKey({ columns: [table.exceptionId, table.userId] }),
}));

export const exceptionRelations = relations(exceptionOrder, ({ one, many }) => ({
	property: one(property, { fields: [exceptionOrder.propertyId], references: [property.id] }),
	order: one(order, { fields: [exceptionOrder.orderId], references: [order.id] }),
	conflictingOrder: one(order, { fields: [exceptionOrder.conflictingOrderId], references: [order.id] }),
	owner: one(user, { fields: [exceptionOrder.ownerId], references: [user.id], relationName: 'owner' }),
	responder: one(user, { fields: [exceptionOrder.responderId], references: [user.id] }),
	creator: one(user, { fields: [exceptionOrder.createdBy], references: [user.id], relationName: 'creator' }),
	responsibles: many(exceptionResponsible),
}));

export const exceptionResponsibleRelations = relations(exceptionResponsible, ({ one }) => ({
	exception: one(exceptionOrder, { fields: [exceptionResponsible.exceptionId], references: [exceptionOrder.id] }),
	user: one(user, { fields: [exceptionResponsible.userId], references: [user.id] }),
}));

export const auditLog = pgTable('audit_log', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => user.id),
	action: text('action').notNull(),
	entityType: text('entity_type').notNull(),
	entityId: text('entity_id').notNull(),
	field: text('field'),
	oldValue: jsonb('old_value'),
	newValue: jsonb('new_value'),
	meta: jsonb('meta').$type<Record<string, unknown>>(),
	ip: text('ip'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
	userIdx: index('audit_user_idx').on(table.userId),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	user: one(user, { fields: [auditLog.userId], references: [user.id] }),
}));
