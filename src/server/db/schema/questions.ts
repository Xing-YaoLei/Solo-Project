import { pgTable, text, varchar, timestamp, json, integer, boolean } from 'drizzle-orm/pg-core';
import { courses, chapters } from './courses';
import { users } from './users';

export type QuestionType = 'single' | 'multiple' | 'judge' | 'fill' | 'essay';

export const questions = pgTable('questions', {
	id: text('id').primaryKey(),
	courseId: text('course_id')
		.notNull()
		.references(() => courses.id, { onDelete: 'cascade' }),
	chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
	type: varchar('type', { length: 20 }).notNull().default('single'),
	content: text('content').notNull(),
	options: json('options'),
	answer: text('answer'),
	analysis: text('analysis'),
	difficulty: integer('difficulty').default(2),
	score: integer('score').default(1),
	isActive: boolean('is_active').notNull().default(true),
	creatorId: text('creator_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const questionTags = pgTable('question_tags', {
	id: text('id').primaryKey(),
	name: varchar('name', { length: 50 }).notNull().unique(),
	color: varchar('color', { length: 7 }).default('#3b82f6'),
	description: text('description'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const questionTagRelations = pgTable('question_tag_relations', {
	id: text('id').primaryKey(),
	questionId: text('question_id')
		.notNull()
		.references(() => questions.id, { onDelete: 'cascade' }),
	tagId: text('tag_id')
		.notNull()
		.references(() => questionTags.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionTag = typeof questionTags.$inferSelect;
export type NewQuestionTag = typeof questionTags.$inferInsert;
