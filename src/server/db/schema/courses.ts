import { pgTable, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const courses = pgTable('courses', {
	id: text('id').primaryKey(),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description'),
	category: varchar('category', { length: 100 }),
	coverImage: text('cover_image'),
	credits: integer('credits').default(0),
	difficulty: varchar('difficulty', { length: 20 }).default('intermediate'),
	isPublished: boolean('is_published').notNull().default(false),
	creatorId: text('creator_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const chapters = pgTable('chapters', {
	id: text('id').primaryKey(),
	courseId: text('course_id')
		.notNull()
		.references(() => courses.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description'),
	sortOrder: integer('sort_order').notNull().default(0),
	durationMinutes: integer('duration_minutes').default(0),
	isFree: boolean('is_free').notNull().default(false),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
