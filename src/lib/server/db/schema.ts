import {
	pgTable,
	text,
	timestamp,
	uuid,
	integer,
	boolean,
	jsonb,
	primaryKey,
	index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'operator', 'reviewer'] }).notNull().default('operator'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp('expires_at').notNull()
});

export const riderTable = pgTable('rider', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	phone: text('phone').notNull().unique(),
	employeeId: text('employee_id').unique(),
	isActive: boolean('is_active').notNull().default(true),
	channel: text('channel', {
		enum: ['platform_a', 'platform_b', 'platform_c', 'other']
	}).notNull().default('other'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const channelTable = pgTable('channel', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	code: text('code').notNull().unique(),
	description: text('description'),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const verificationRecordTable = pgTable('verification_record', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderNo: text('order_no').notNull().unique(),
	riderId: uuid('rider_id').references(() => riderTable.id),
	channelId: uuid('channel_id').references(() => channelTable.id),
	responsiblePerson: text('responsible_person'),
	status: text('status', {
		enum: [
			'pending',
			'processing',
			'abnormal',
			'reviewing',
			'completed',
			'closed'
		]
	}).notNull().default('pending'),
	abnormalType: text('abnormal_type', {
		enum: [
			'none',
			'damaged',
			'lost',
			'wrong_item',
			'quantity_mismatch',
			'other'
		]
	}).notNull().default('none'),
	closeReason: text('close_reason'),
	pickupAddress: text('pickup_address'),
	deliveryAddress: text('delivery_address').notNull(),
	itemName: text('item_name').notNull(),
	itemQuantity: integer('item_quantity').notNull().default(1),
	itemDescription: text('item_description'),
	photos: jsonb('photos').$type<string[]>().default([]),
	evaluationTags: jsonb('evaluation_tags').$type<string[]>().default([]),
	remark: text('remark'),
	handlerId: text('handler_id').references(() => userTable.id),
	reviewerId: text('reviewer_id').references(() => userTable.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	closedAt: timestamp('closed_at')
}, (table) => ({
	statusIdx: index('vr_status_idx').on(table.status),
	riderIdx: index('vr_rider_idx').on(table.riderId),
	channelIdx: index('vr_channel_idx').on(table.channelId),
	abnormalTypeIdx: index('vr_abnormal_type_idx').on(table.abnormalType),
	createdAtIndex: index('vr_created_at_idx').on(table.createdAt)
}));

export const verificationRecordRelations = relations(verificationRecordTable, ({ one }) => ({
	rider: one(riderTable, {
		fields: [verificationRecordTable.riderId],
		references: [riderTable.id]
	}),
	channel: one(channelTable, {
		fields: [verificationRecordTable.channelId],
		references: [channelTable.id]
	}),
	handler: one(userTable, {
		fields: [verificationRecordTable.handlerId],
		references: [userTable.id]
	}),
	reviewer: one(userTable, {
		fields: [verificationRecordTable.reviewerId],
		references: [userTable.id]
	})
}));

export const operationLogTable = pgTable('operation_log', {
	id: uuid('id').primaryKey().defaultRandom(),
	recordId: uuid('record_id')
		.notNull()
		.references(() => verificationRecordTable.id),
	operatorId: text('operator_id').references(() => userTable.id),
	action: text('action').notNull(),
	previousStatus: text('previous_status'),
	newStatus: text('new_status'),
	remark: text('remark'),
	createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
	recordIdx: index('ol_record_idx').on(table.recordId),
	createdAtIndex: index('ol_created_at_idx').on(table.createdAt)
}));

export const operationLogRelations = relations(operationLogTable, ({ one }) => ({
	record: one(verificationRecordTable, {
		fields: [operationLogTable.recordId],
		references: [verificationRecordTable.id]
	}),
	operator: one(userTable, {
		fields: [operationLogTable.operatorId],
		references: [userTable.id]
	})
}));

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
export type Rider = typeof riderTable.$inferSelect;
export type NewRider = typeof riderTable.$inferInsert;
export type Channel = typeof channelTable.$inferSelect;
export type NewChannel = typeof channelTable.$inferInsert;
export type VerificationRecord = typeof verificationRecordTable.$inferSelect;
export type NewVerificationRecord = typeof verificationRecordTable.$inferInsert;
export type OperationLog = typeof operationLogTable.$inferSelect;
export type NewOperationLog = typeof operationLogTable.$inferInsert;

export type VerificationStatus = VerificationRecord['status'];
export type AbnormalType = VerificationRecord['abnormalType'];
export type UserRole = User['role'];
