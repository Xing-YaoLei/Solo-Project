import { pgTable, text, integer, real, boolean, date, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	displayName: text('display_name').notNull(),
	role: text('role', { enum: ['admin', 'inspector', 'maintenance', 'finance', 'tenant'] }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
});

export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
}, (table) => [
	index('idx_sessions_user').on(table.userId)
]);

export const buildings = pgTable('buildings', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	name: text('name').notNull(),
	address: text('address').notNull(),
	totalRooms: integer('total_rooms').notNull().default(0),
	vacancyRate: real('vacancy_rate').notNull().default(0)
});

export const rooms = pgTable('rooms', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	buildingId: text('building_id').notNull().references(() => buildings.id, { onDelete: 'cascade' }),
	floor: text('floor').notNull(),
	unit: text('unit').notNull(),
	roomNumber: text('room_number').notNull(),
	status: text('status', { enum: ['vacant', 'occupied', 'maintenance'] }).notNull().default('vacant'),
	area: real('area').notNull().default(0)
}, (table) => [
	index('idx_rooms_building').on(table.buildingId)
]);

export const tenants = pgTable('tenants', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	companyName: text('company_name').notNull(),
	contactName: text('contact_name').notNull(),
	contactPhone: text('contact_phone').notNull(),
	userId: text('user_id').references(() => users.id, { onDelete: 'set null' })
});

export const contracts = pgTable('contracts', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	tenantId: text('tenant_id').notNull().references(() => tenants.id),
	roomId: text('room_id').notNull().references(() => rooms.id),
	startDate: date('start_date').notNull(),
	endDate: date('end_date').notNull(),
	monthlyRent: real('monthly_rent').notNull(),
	status: text('status', { enum: ['pending', 'active', 'expired', 'terminated'] }).notNull().default('pending'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
}, (table) => [
	index('idx_contracts_tenant').on(table.tenantId),
	index('idx_contracts_room').on(table.roomId),
	index('idx_contracts_status').on(table.status)
]);

export const inspections = pgTable('inspections', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	name: text('name').notNull(),
	buildingId: text('building_id').notNull().references(() => buildings.id),
	assigneeId: text('assignee_id').notNull().references(() => users.id),
	status: text('status', { enum: ['pending', 'in_progress', 'completed', 'cancelled'] }).notNull().default('pending'),
	scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
	completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => [
	index('idx_inspections_building').on(table.buildingId),
	index('idx_inspections_assignee').on(table.assigneeId)
]);

export const checkpoints = pgTable('checkpoints', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	inspectionId: text('inspection_id').notNull().references(() => inspections.id, { onDelete: 'cascade' }),
	roomId: text('room_id').notNull().references(() => rooms.id),
	sortOrder: integer('sort_order').notNull().default(0),
	status: text('status', { enum: ['pending', 'checked', 'anomaly'] }).notNull().default('pending'),
	note: text('note'),
	checkedAt: timestamp('checked_at', { withTimezone: true })
}, (table) => [
	index('idx_checkpoints_inspection').on(table.inspectionId)
]);

export const anomalies = pgTable('anomalies', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	checkpointId: text('checkpoint_id').notNull().references(() => checkpoints.id, { onDelete: 'cascade' }),
	reporterId: text('reporter_id').notNull().references(() => users.id),
	description: text('description').notNull(),
	images: text('images'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
});

export const utilityReadings = pgTable('utility_readings', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	roomId: text('room_id').notNull().references(() => rooms.id),
	period: text('period').notNull(),
	electricityReading: real('electricity_reading').notNull().default(0),
	waterReading: real('water_reading').notNull().default(0),
	electricityUsage: real('electricity_usage').notNull().default(0),
	waterUsage: real('water_usage').notNull().default(0),
	isAnomaly: boolean('is_anomaly').notNull().default(false),
	verified: boolean('verified').notNull().default(false),
	readerId: text('reader_id').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
}, (table) => [
	index('idx_utility_room_period').on(table.roomId, table.period)
]);

export const workOrders = pgTable('work_orders', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	title: text('title').notNull(),
	description: text('description').notNull(),
	roomId: text('room_id').notNull().references(() => rooms.id),
	tenantId: text('tenant_id').notNull().references(() => tenants.id),
	assigneeId: text('assignee_id').references(() => users.id),
	priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
	status: text('status', { enum: ['submitted', 'assigned', 'in_progress', 'completed', 'reviewing', 'closed'] }).notNull().default('submitted'),
	timeoutMinutes: integer('timeout_minutes').notNull().default(480),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()')),
	assignedAt: timestamp('assigned_at', { withTimezone: true }),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	dueAt: timestamp('due_at', { withTimezone: true })
}, (table) => [
	index('idx_work_orders_status').on(table.status),
	index('idx_work_orders_assignee').on(table.assigneeId),
	index('idx_work_orders_due').on(table.dueAt)
]);

export const communicationRecords = pgTable('communication_records', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
	senderId: text('sender_id').notNull().references(() => users.id),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
}, (table) => [
	index('idx_communication_work_order').on(table.workOrderId)
]);

export const reviewOpinions = pgTable('review_opinions', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	workOrderId: text('work_order_id').notNull().references(() => workOrders.id, { onDelete: 'cascade' }),
	reviewerId: text('reviewer_id').notNull().references(() => users.id),
	opinion: text('opinion').notNull(),
	action: text('action', { enum: ['confirm', 'return'] }).notNull().default('confirm'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
}, (table) => [
	index('idx_review_work_order').on(table.workOrderId)
]);

export const approvals = pgTable('approvals', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	contractId: text('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
	approverId: text('approver_id').notNull().references(() => users.id),
	opinion: text('opinion').notNull(),
	action: text('action', { enum: ['approve', 'reject'] }).notNull().default('approve'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql('NOW()'))
}, (table) => [
	index('idx_approvals_contract').on(table.contractId)
]);

export const facilities = pgTable('facilities', {
	id: text('id').primaryKey().default(sql('gen_random_uuid()')),
	roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	category: text('category').notNull(),
	condition: text('condition', { enum: ['good', 'fair', 'poor', 'broken'] }).notNull().default('good'),
	installedAt: timestamp('installed_at', { withTimezone: true })
});
