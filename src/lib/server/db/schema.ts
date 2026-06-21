import {
	pgTable,
	text,
	timestamp,
	varchar,
	integer,
	boolean,
	jsonb,
	uuid,
	foreignKey,
	primaryKey,
	pgEnum
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

export const documentTypeEnum = pgEnum('document_type', [
	'change_order',
	'acceptance_photo',
	'worker_checkin',
	'after_sales_order'
]);

export const statusEnum = pgEnum('status', [
	'draft',
	'pending',
	'processing',
	'approved',
	'rejected',
	'completed',
	'cancelled'
]);

export const roleEnum = pgEnum('role', [
	'project_manager',
	'designer',
	'foreman',
	'worker',
	'supplier',
	'client',
	'admin'
]);

export const delayReasonEnum = pgEnum('delay_reason', [
	'supplier_delay',
	'production_issue',
	'transport_issue',
	'customs_clearance',
	'other'
]);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	username: varchar('username', { length: 50 }).unique().notNull(),
	email: varchar('email', { length: 255 }).unique().notNull(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	fullName: varchar('full_name', { length: 100 }).notNull(),
	phone: varchar('phone', { length: 20 }),
	role: roleEnum('role').notNull().default('worker'),
	avatar: text('avatar'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
	id: varchar('id', { length: 128 }).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at').notNull()
});

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 200 }).notNull(),
	address: text('address').notNull(),
	clientName: varchar('client_name', { length: 100 }).notNull(),
	clientPhone: varchar('client_phone', { length: 20 }),
	projectManagerId: uuid('project_manager_id').references(() => users.id),
	startDate: timestamp('start_date'),
	expectedEndDate: timestamp('expected_end_date'),
	actualEndDate: timestamp('actual_end_date'),
	budget: integer('budget'),
	status: statusEnum('status').notNull().default('processing'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const changeOrders = pgTable('change_orders', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	code: varchar('code', { length: 50 }).unique().notNull(),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description'),
	reason: text('reason'),
	impact: text('impact'),
	originalPlan: text('original_plan'),
	newPlan: text('new_plan'),
	costChange: integer('cost_change').default(0),
	timeChangeDays: integer('time_change_days').default(0),
	status: statusEnum('status').notNull().default('draft'),
	createdById: uuid('created_by_id')
		.notNull()
		.references(() => users.id),
	assignedToId: uuid('assigned_to_id').references(() => users.id),
	approvedById: uuid('approved_by_id').references(() => users.id),
	approvedAt: timestamp('approved_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const acceptancePhotos = pgTable('acceptance_photos', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	changeOrderId: uuid('change_order_id').references(() => changeOrders.id, {
		onDelete: 'set null'
	}),
	code: varchar('code', { length: 50 }).unique().notNull(),
	title: varchar('title', { length: 200 }).notNull(),
	stage: varchar('stage', { length: 100 }),
	description: text('description'),
	photoUrls: jsonb('photo_urls').notNull().default(sql`'[]'::jsonb`),
	inspectionItems: jsonb('inspection_items').default(sql`'[]'::jsonb`),
	status: statusEnum('status').notNull().default('pending'),
	inspectedById: uuid('inspected_by_id').references(() => users.id),
	inspectedAt: timestamp('inspected_at'),
	accepted: boolean('accepted').default(false),
	comments: text('comments'),
	createdById: uuid('created_by_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const workerCheckins = pgTable('worker_checkins', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	changeOrderId: uuid('change_order_id').references(() => changeOrders.id, {
		onDelete: 'set null'
	}),
	workerId: uuid('worker_id')
		.notNull()
		.references(() => users.id),
	checkinTime: timestamp('checkin_time').notNull().defaultNow(),
	checkoutTime: timestamp('checkout_time'),
	location: jsonb('location'),
	workContent: text('work_content'),
	workHours: integer('work_hours').default(0),
	photos: jsonb('photos').default(sql`'[]'::jsonb`),
	notes: text('notes'),
	verified: boolean('verified').default(false),
	verifiedById: uuid('verified_by_id').references(() => users.id),
	verifiedAt: timestamp('verified_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const afterSalesOrders = pgTable('after_sales_order', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	changeOrderId: uuid('change_order_id').references(() => changeOrders.id, {
		onDelete: 'set null'
	}),
	code: varchar('code', { length: 50 }).unique().notNull(),
	title: varchar('title', { length: 200 }).notNull(),
	type: varchar('type', { length: 50 }),
	description: text('description'),
	priority: varchar('priority', { length: 20 }).default('normal'),
	reportedByName: varchar('reported_by_name', { length: 100 }),
	reportedByPhone: varchar('reported_by_phone', { length: 20 }),
	status: statusEnum('status').notNull().default('pending'),
	assignedToId: uuid('assigned_to_id').references(() => users.id),
	scheduledTime: timestamp('scheduled_time'),
	completedTime: timestamp('completed_time'),
	resolution: text('resolution'),
	photos: jsonb('photos').default(sql`'[]'::jsonb`),
	createdById: uuid('created_by_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const attachments = pgTable('attachments', {
	id: uuid('id').primaryKey().defaultRandom(),
	documentId: uuid('document_id').notNull(),
	documentType: documentTypeEnum('document_type').notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	url: text('url').notNull(),
	size: integer('size'),
	mimeType: varchar('mime_type', { length: 100 }),
	uploadedById: uuid('uploaded_by_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const notes = pgTable('notes', {
	id: uuid('id').primaryKey().defaultRandom(),
	documentId: uuid('document_id').notNull(),
	documentType: documentTypeEnum('document_type').notNull(),
	content: text('content').notNull(),
	createdById: uuid('created_by_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const flowRecords = pgTable('flow_records', {
	id: uuid('id').primaryKey().defaultRandom(),
	documentId: uuid('document_id').notNull(),
	documentType: documentTypeEnum('document_type').notNull(),
	fromStatus: statusEnum('from_status'),
	toStatus: statusEnum('to_status').notNull(),
	action: varchar('action', { length: 50 }).notNull(),
	comments: text('comments'),
	performedById: uuid('performed_by_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const materialDelays = pgTable('material_delays', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	changeOrderId: uuid('change_order_id').references(() => changeOrders.id, {
		onDelete: 'set null'
	}),
	materialName: varchar('material_name', { length: 200 }).notNull(),
	materialType: varchar('material_type', { length: 100 }),
	quantity: varchar('quantity', { length: 100 }),
	originalDeliveryDate: timestamp('original_delivery_date').notNull(),
	expectedDeliveryDate: timestamp('expected_delivery_date').notNull(),
	reason: delayReasonEnum('reason').notNull(),
	description: text('description'),
	status: statusEnum('status').notNull().default('processing'),
	delayDays: integer('delay_days').notNull().default(0),
	responsibleRole: roleEnum('responsible_role').notNull(),
	responsibleId: uuid('responsible_id').references(() => users.id),
	previousResponsibleId: uuid('previous_responsible_id').references(() => users.id),
	lastTransferAt: timestamp('last_transfer_at'),
	transferNote: text('transfer_note'),
	createdById: uuid('created_by_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const affectedObjects = pgTable('affected_objects', {
	id: uuid('id').primaryKey().defaultRandom(),
	materialDelayId: uuid('material_delay_id')
		.notNull()
		.references(() => materialDelays.id, { onDelete: 'cascade' }),
	objectType: varchar('object_type', { length: 50 }).notNull(),
	objectName: varchar('object_name', { length: 200 }).notNull(),
	objectId: uuid('object_id'),
	impactDescription: text('impact_description'),
	estimatedDelayDays: integer('estimated_delay_days').default(0),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const documentRelations = pgTable(
	'document_relations',
	{
		sourceId: uuid('source_id').notNull(),
		sourceType: documentTypeEnum('source_type').notNull(),
		targetId: uuid('target_id').notNull(),
		targetType: documentTypeEnum('target_type').notNull(),
		relationType: varchar('relation_type', { length: 50 }).notNull().default('reference'),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.sourceId, table.targetId, table.relationType] })
	})
);

export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type Project = InferSelectModel<typeof projects>;
export type InsertProject = InferInsertModel<typeof projects>;
export type ChangeOrder = InferSelectModel<typeof changeOrders>;
export type InsertChangeOrder = InferInsertModel<typeof changeOrders>;
export type AcceptancePhoto = InferSelectModel<typeof acceptancePhotos>;
export type InsertAcceptancePhoto = InferInsertModel<typeof acceptancePhotos>;
export type WorkerCheckin = InferSelectModel<typeof workerCheckins>;
export type InsertWorkerCheckin = InferInsertModel<typeof workerCheckins>;
export type AfterSalesOrder = InferSelectModel<typeof afterSalesOrders>;
export type InsertAfterSalesOrder = InferInsertModel<typeof afterSalesOrders>;
export type MaterialDelay = InferSelectModel<typeof materialDelays>;
export type InsertMaterialDelay = InferInsertModel<typeof materialDelays>;
export type AffectedObject = InferSelectModel<typeof affectedObjects>;
export type InsertAffectedObject = InferInsertModel<typeof affectedObjects>;
export type FlowRecord = InferSelectModel<typeof flowRecords>;
export type InsertFlowRecord = InferInsertModel<typeof flowRecords>;
export type Attachment = InferSelectModel<typeof attachments>;
export type Note = InferSelectModel<typeof notes>;
export type Session = InferSelectModel<typeof sessions>;
