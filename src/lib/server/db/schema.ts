import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  foreignKey
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  region: varchar('region', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  plateNumber: varchar('plate_number', { length: 20 }).unique().notNull(),
  vin: varchar('vin', { length: 50 }).unique().notNull(),
  brand: varchar('brand', { length: 50 }),
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  currentMileage: integer('current_mileage').default(0),
  lastServiceDate: timestamp('last_service_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const quoteItems = pgTable('quote_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  category: varchar('category', { length: 100 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  laborHours: decimal('labor_hours', { precision: 8, scale: 2 }).default('0'),
  laborPrice: decimal('labor_price', { precision: 10, scale: 2 }).default('0'),
  description: text('description'),
  isActive: boolean('is_active').default(true)
});

export const quoteParts = pgTable('quote_parts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  quoteItemId: uuid('quote_item_id')
    .notNull()
    .references(() => quoteItems.id, { onDelete: 'cascade' }),
  partNumber: varchar('part_number', { length: 100 }).notNull(),
  partName: varchar('part_name', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull()
});

export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  diagnosisResult: text('diagnosis_result'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  region: varchar('region', { length: 50 }),
  isRework: boolean('is_rework').default(false),
  reworkCause: varchar('rework_cause', { length: 500 }),
  inspectionPhotos: jsonb('inspection_photos'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true })
});

export const workOrderItems = pgTable('work_order_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: uuid('work_order_id')
    .notNull()
    .references(() => workOrders.id, { onDelete: 'cascade' }),
  quoteItemId: uuid('quote_item_id')
    .notNull()
    .references(() => quoteItems.id),
  quantity: integer('quantity').notNull().default(1),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull()
});

export const shortageOrders = pgTable('shortage_orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: uuid('work_order_id')
    .notNull()
    .references(() => workOrders.id, { onDelete: 'cascade' }),
  partNumber: varchar('part_number', { length: 100 }).notNull(),
  partName: varchar('part_name', { length: 200 }).notNull(),
  quantity: integer('quantity').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  assigneeId: uuid('assignee_id')
    .notNull()
    .references(() => users.id),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id),
  region: varchar('region', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const shortageHistory = pgTable('shortage_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  shortageOrderId: uuid('shortage_order_id')
    .notNull()
    .references(() => shortageOrders.id, { onDelete: 'cascade' }),
  operatorId: uuid('operator_id')
    .notNull()
    .references(() => users.id),
  action: varchar('action', { length: 20 }).notNull(),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const inspectionRules = pgTable('inspection_rules', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 200 }).notNull(),
  workOrderType: varchar('work_order_type', { length: 50 }),
  requiredPhotos: integer('required_photos').notNull().default(0),
  photoTemplates: jsonb('photo_templates'),
  isActive: boolean('is_active').default(true)
});

export const vehicleThresholds = pgTable('vehicle_thresholds', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: uuid('vehicle_id')
    .notNull()
    .references(() => vehicles.id, { onDelete: 'cascade' }),
  mileageThreshold: integer('mileage_threshold').default(10000),
  daysThreshold: integer('days_threshold').default(180),
  reminderType: varchar('reminder_type', { length: 50 }).default('service'),
  lastNotified: timestamp('last_notified', { withTimezone: true })
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type NewQuoteItem = typeof quoteItems.$inferInsert;
export type QuotePart = typeof quoteParts.$inferSelect;
export type NewQuotePart = typeof quoteParts.$inferInsert;
export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;
export type WorkOrderItem = typeof workOrderItems.$inferSelect;
export type NewWorkOrderItem = typeof workOrderItems.$inferInsert;
export type ShortageOrder = typeof shortageOrders.$inferSelect;
export type NewShortageOrder = typeof shortageOrders.$inferInsert;
export type ShortageHistoryItem = typeof shortageHistory.$inferSelect;
export type NewShortageHistoryItem = typeof shortageHistory.$inferInsert;
export type InspectionRule = typeof inspectionRules.$inferSelect;
export type NewInspectionRule = typeof inspectionRules.$inferInsert;
export type VehicleThreshold = typeof vehicleThresholds.$inferSelect;
export type NewVehicleThreshold = typeof vehicleThresholds.$inferInsert;
