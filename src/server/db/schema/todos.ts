import { pgTable, text, varchar, timestamp, json, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';
import { examScores } from './progress';

export type TodoStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'transferred';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoSource = 'progress_delay' | 'manual' | 'system' | 'exam_failed';

export const todos = pgTable('todos', {
	id: text('id').primaryKey(),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description'),
	status: varchar('status', { length: 20 }).notNull().default('pending'),
	priority: varchar('priority', { length: 20 }).notNull().default('medium'),
	source: varchar('source', { length: 30 }).notNull().default('manual'),
	category: varchar('category', { length: 50 }),
	relatedUserId: text('related_user_id').references(() => users.id),
	relatedCourseId: text('related_course_id').references(() => courses.id),
	relatedExamId: text('related_exam_id').references(() => examScores.id),
	assigneeId: text('assignee_id').references(() => users.id),
	assigneeRole: varchar('assignee_role', { length: 20 }),
	creatorId: text('creator_id')
		.notNull()
		.references(() => users.id),
	previousAssigneeId: text('previous_assignee_id').references(() => users.id),
	transferReason: text('transfer_reason'),
	dueDate: timestamp('due_date'),
	completedAt: timestamp('completed_at'),
	metadata: json('metadata').default({}),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const todoComments = pgTable('todo_comments', {
	id: text('id').primaryKey(),
	todoId: text('todo_id')
		.notNull()
		.references(() => todos.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	content: text('content').notNull(),
	attachments: json('attachments').default([]),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const todoMaterials = pgTable('todo_materials', {
	id: text('id').primaryKey(),
	todoId: text('todo_id')
		.notNull()
		.references(() => todos.id, { onDelete: 'cascade' }),
	uploaderId: text('uploader_id')
		.notNull()
		.references(() => users.id),
	title: varchar('title', { length: 200 }).notNull(),
	description: text('description'),
	fileUrl: text('file_url'),
	fileType: varchar('file_type', { length: 50 }),
	fileSize: integer('file_size').default(0),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type TodoComment = typeof todoComments.$inferSelect;
export type NewTodoComment = typeof todoComments.$inferInsert;
export type TodoMaterial = typeof todoMaterials.$inferSelect;
export type NewTodoMaterial = typeof todoMaterials.$inferInsert;
