import { pgTable, uuid, text, integer, timestamp, numeric } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').unique().notNull(),
	password_hash: text('password_hash').notNull(),
	display_name: text('display_name'),
	role: text('role').default('staff'),
	created_at: timestamp('created_at').defaultNow()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	user_id: text('user_id').references(() => user.id).notNull(),
	expires_at: timestamp('expires_at').notNull()
});

export const performance = pgTable('performance', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	venue: text('venue').notNull(),
	show_date: timestamp('show_date').notNull(),
	duration_minutes: integer('duration_minutes').notNull(),
	status: text('status').default('draft'),
	assignee_id: text('assignee_id').references(() => user.id),
	description: text('description'),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at').defaultNow()
});

export const seatZone = pgTable('seat_zone', {
	id: uuid('id').primaryKey().defaultRandom(),
	performance_id: uuid('performance_id').references(() => performance.id).notNull(),
	zone_name: text('zone_name').notNull(),
	zone_type: text('zone_type').notNull(),
	total_seats: integer('total_seats').notNull(),
	available_seats: integer('available_seats').notNull(),
	price: numeric('price').notNull(),
	created_at: timestamp('created_at').defaultNow()
});

export const checkinCode = pgTable('checkin_code', {
	id: uuid('id').primaryKey().defaultRandom(),
	performance_id: uuid('performance_id').references(() => performance.id).notNull(),
	code: text('code').notNull().unique(),
	ticket_type: text('ticket_type').notNull(),
	seat_zone_id: uuid('seat_zone_id').references(() => seatZone.id),
	status: text('status').default('unused'),
	used_at: timestamp('used_at'),
	created_at: timestamp('created_at').defaultNow()
});

export const sponsor = pgTable('sponsor', {
	id: uuid('id').primaryKey().defaultRandom(),
	performance_id: uuid('performance_id').references(() => performance.id).notNull(),
	name: text('name').notNull(),
	contact: text('contact'),
	tier: text('tier').notNull(),
	amount: numeric('amount').notNull(),
	notes: text('notes'),
	created_at: timestamp('created_at').defaultNow()
});

export const exceptionRecord = pgTable('exception_record', {
	id: uuid('id').primaryKey().defaultRandom(),
	performance_id: uuid('performance_id').references(() => performance.id).notNull(),
	type: text('type').notNull(),
	status: text('status').default('pending'),
	description: text('description').notNull(),
	handler_id: text('handler_id').references(() => user.id),
	resolution: text('resolution'),
	source: text('source'),
	created_at: timestamp('created_at').defaultNow(),
	updated_at: timestamp('updated_at').defaultNow()
});

export const exceptionAction = pgTable('exception_action', {
	id: uuid('id').primaryKey().defaultRandom(),
	exception_id: uuid('exception_id').references(() => exceptionRecord.id).notNull(),
	action_type: text('action_type').notNull(),
	content: text('content').notNull(),
	operator_id: text('operator_id').references(() => user.id).notNull(),
	created_at: timestamp('created_at').defaultNow()
});
