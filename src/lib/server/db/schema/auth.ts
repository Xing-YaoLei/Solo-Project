import { pgTable, text, timestamp, integer, json, boolean, uuid } from 'drizzle-orm/pg-core';

export const userTable = pgTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().default('operator'),
	realName: text('real_name'),
	region: text('region'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const sessionTable = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp('expires_at').notNull()
});
