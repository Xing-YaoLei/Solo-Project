import { pgTable, text, varchar, timestamp, json } from 'drizzle-orm/pg-core';
import { users } from './users';

export type UserRoleCode = 'student' | 'assistant' | 'lecturer' | 'admin';

export const roles = pgTable('roles', {
	id: text('id').primaryKey(),
	name: varchar('name', { length: 50 }).notNull().unique(),
	code: varchar('code', { length: 20 }).notNull().unique(),
	description: text('description'),
	permissions: json('permissions').notNull().default({}),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const userRoles = pgTable('user_roles', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	roleId: text('role_id')
		.notNull()
		.references(() => roles.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
