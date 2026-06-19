import {
	pgEnum,
	pgTable,
	text,
	varchar,
	timestamp,
	date,
	integer,
	numeric,
	uuid,
	bigint,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRole = pgEnum('user_role', ['ADVISOR', 'TECHNICIAN', 'PARTS', 'MANAGER']);
export const woStatus = pgEnum('wo_status', [
	'PENDING',
	'CONFIRMED',
	'IN_PROGRESS',
	'INSPECTION',
	'COMPLETED',
	'CANCELLED'
]);
export const woItemStatus = pgEnum('wo_item_status', ['TODO', 'DOING', 'DONE']);
export const movementType = pgEnum('movement_type', ['IN', 'OUT', 'ADJUST']);
export const quoteStatus = pgEnum('quote_status', [
	'DRAFT',
	'PENDING_CONFIRM',
	'CONFIRMED',
	'VOID'
]);
export const reminderStatus = pgEnum('reminder_status', [
	'PENDING',
	'CONTACTED',
	'ARRANGED',
	'CANCELLED'
]);
export const exceptionType = pgEnum('exception_type', [
	'PARTS_SHORTAGE',
	'REWORK',
	'CUSTOMER_COMPLAINT',
	'OTHER'
]);
export const exceptionStatus = pgEnum('exception_status', [
	'PENDING',
	'PROCESSING',
	'REVIEWING',
	'CLOSED'
]);
export const attachmentCategory = pgEnum('attachment_category', [
	'INSPECTION',
	'CONSTRUCTION',
	'EXCEPTION',
	'OTHER'
]);

export const users = pgTable(
	'users',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		username: varchar('username', { length: 50 }).notNull(),
		passwordHash: varchar('password_hash', { length: 255 }).notNull(),
		name: varchar('name', { length: 50 }).notNull(),
		role: userRole('role').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		usernameUnique: uniqueIndex('users_username_unique').on(table.username)
	})
);

export const userSessions = pgTable(
	'user_sessions',
	{
		id: varchar('id', { length: 128 }).primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => ({
		userIdIdx: index('idx_sessions_user').on(table.userId)
	})
);

export const customers = pgTable('customers', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	name: varchar('name', { length: 50 }).notNull(),
	phone: varchar('phone', { length: 20 }).notNull(),
	remark: text('remark')
});

export const vehicles = pgTable(
	'vehicles',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		customerId: uuid('customer_id')
			.notNull()
			.references(() => customers.id),
		plateNumber: varchar('plate_number', { length: 20 }).notNull(),
		vin: varchar('vin', { length: 50 }),
		brand: varchar('brand', { length: 50 }),
		model: varchar('model', { length: 100 }),
		mileage: integer('mileage').notNull().default(0),
		lastMaintenanceDate: date('last_maintenance_date')
	},
	(table) => ({
		plateUnique: uniqueIndex('vehicles_plate_number_unique').on(table.plateNumber),
		vinUnique: uniqueIndex('vehicles_vin_unique').on(table.vin)
	})
);

export const workOrders = pgTable(
	'work_orders',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		orderNo: varchar('order_no', { length: 32 }).notNull(),
		customerId: uuid('customer_id')
			.notNull()
			.references(() => customers.id),
		vehicleId: uuid('vehicle_id')
			.notNull()
			.references(() => vehicles.id),
		advisorId: uuid('advisor_id')
			.notNull()
			.references(() => users.id),
		technicianId: uuid('technician_id').references(() => users.id),
		status: woStatus('status').notNull().default('PENDING'),
		totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
		remark: text('remark'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' })
	},
	(table) => ({
		orderNoUnique: uniqueIndex('work_orders_order_no_unique').on(table.orderNo),
		statusIdx: index('idx_wo_status').on(table.status),
		advisorIdx: index('idx_wo_advisor').on(table.advisorId),
		techIdx: index('idx_wo_tech').on(table.technicianId),
		createdIdx: index('idx_wo_created').on(table.createdAt)
	})
);

export const workOrderItems = pgTable('work_order_items', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	workOrderId: uuid('work_order_id')
		.notNull()
		.references(() => workOrders.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 200 }).notNull(),
	laborHours: numeric('labor_hours', { precision: 6, scale: 2 }).notNull().default('0'),
	laborPrice: numeric('labor_price', { precision: 12, scale: 2 }).notNull().default('0'),
	partsPrice: numeric('parts_price', { precision: 12, scale: 2 }).notNull().default('0'),
	status: woItemStatus('status').notNull().default('TODO')
});

export const parts = pgTable(
	'parts',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		sku: varchar('sku', { length: 50 }).notNull(),
		name: varchar('name', { length: 200 }).notNull(),
		category: varchar('category', { length: 50 }),
		stockQuantity: integer('stock_quantity').notNull().default(0),
		safetyStock: integer('safety_stock').notNull().default(0),
		unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
		unit: varchar('unit', { length: 20 }).notNull().default('个')
	},
	(table) => ({
		skuUnique: uniqueIndex('parts_sku_unique').on(table.sku)
	})
);

export const partMovements = pgTable(
	'part_movements',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		partId: uuid('part_id')
			.notNull()
			.references(() => parts.id),
		workOrderId: uuid('work_order_id').references(() => workOrders.id),
		type: movementType('type').notNull(),
		quantity: integer('quantity').notNull(),
		source: varchar('source', { length: 100 }),
		remark: text('remark'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		partIdx: index('idx_pm_part').on(table.partId),
		woIdx: index('idx_pm_wo').on(table.workOrderId)
	})
);

export const quotes = pgTable(
	'quotes',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		workOrderId: uuid('work_order_id').references(() => workOrders.id),
		quoteNo: varchar('quote_no', { length: 32 }).notNull(),
		totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
		discount: numeric('discount', { precision: 5, scale: 2 }).notNull().default('0'),
		status: quoteStatus('status').notNull().default('DRAFT'),
		confirmedAt: date('confirmed_at')
	},
	(table) => ({
		quoteNoUnique: uniqueIndex('quotes_quote_no_unique').on(table.quoteNo)
	})
);

export const maintenanceReminders = pgTable(
	'maintenance_reminders',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		vehicleId: uuid('vehicle_id')
			.notNull()
			.references(() => vehicles.id),
		remindDate: date('remind_date').notNull(),
		status: reminderStatus('status').notNull().default('PENDING'),
		content: text('content')
	},
	(table) => ({
		remindDateIdx: index('idx_remind_date').on(table.remindDate)
	})
);

export const exceptions = pgTable('exceptions', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	workOrderId: uuid('work_order_id').references(() => workOrders.id),
	creatorId: uuid('creator_id')
		.notNull()
		.references(() => users.id),
	assigneeId: uuid('assignee_id')
		.notNull()
		.references(() => users.id),
	type: exceptionType('type').notNull(),
	status: exceptionStatus('status').notNull().default('PENDING'),
	title: varchar('title', { length: 200 }).notNull(),
	materialSource: text('material_source'),
	closeConclusion: text('close_conclusion'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
		.notNull()
		.defaultNow()
});

export const exceptionLogs = pgTable('exception_logs', {
	id: uuid('id')
		.primaryKey()
		.default(sql`gen_random_uuid()`),
	exceptionId: uuid('exception_id')
		.notNull()
		.references(() => exceptions.id, { onDelete: 'cascade' }),
	operatorId: uuid('operator_id')
		.notNull()
		.references(() => users.id),
	content: text('content').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
		.notNull()
		.defaultNow()
});

export const attachments = pgTable(
	'attachments',
	{
		id: uuid('id')
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		refType: varchar('ref_type', { length: 32 }).notNull(),
		refId: uuid('ref_id').notNull(),
		fileName: varchar('file_name', { length: 255 }).notNull(),
		filePath: varchar('file_path', { length: 500 }).notNull(),
		fileSize: bigint('file_size', { mode: 'number' }).notNull(),
		mimeType: varchar('mime_type', { length: 100 }).notNull(),
		category: attachmentCategory('category').default('OTHER'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow()
	},
	(table) => ({
		refIdx: index('idx_attach_ref').on(table.refType, table.refId)
	})
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;
export type WorkOrderItem = typeof workOrderItems.$inferSelect;
export type NewWorkOrderItem = typeof workOrderItems.$inferInsert;
export type Part = typeof parts.$inferSelect;
export type NewPart = typeof parts.$inferInsert;
export type PartMovement = typeof partMovements.$inferSelect;
export type NewPartMovement = typeof partMovements.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type MaintenanceReminder = typeof maintenanceReminders.$inferSelect;
export type NewMaintenanceReminder = typeof maintenanceReminders.$inferInsert;
export type Exception = typeof exceptions.$inferSelect;
export type NewException = typeof exceptions.$inferInsert;
export type ExceptionLog = typeof exceptionLogs.$inferSelect;
export type NewExceptionLog = typeof exceptionLogs.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type UserRole = (typeof userRole.enumValues)[number];
export type WoStatus = (typeof woStatus.enumValues)[number];
export type WoItemStatus = (typeof woItemStatus.enumValues)[number];
export type MovementType = (typeof movementType.enumValues)[number];
export type QuoteStatus = (typeof quoteStatus.enumValues)[number];
export type ReminderStatus = (typeof reminderStatus.enumValues)[number];
export type ExceptionType = (typeof exceptionType.enumValues)[number];
export type ExceptionStatus = (typeof exceptionStatus.enumValues)[number];
export type AttachmentCategory = (typeof attachmentCategory.enumValues)[number];
