import { pgTable, text, varchar, timestamp, json, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { chapters } from './courses';

export const reminderRules = pgTable('reminder_rules', {
	id: text('id').primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description'),
	ruleType: varchar('rule_type', { length: 50 }).notNull(),
	triggerCondition: json('trigger_condition').notNull().default({}),
	actionType: varchar('action_type', { length: 50 }).notNull().default('notification'),
	notificationChannels: json('notification_channels').notNull().default(['site']),
	isEnabled: boolean('is_enabled').notNull().default(true),
	creatorId: text('creator_id')
		.notNull()
		.references(() => users.id),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const chapterTraces = pgTable('chapter_traces', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	chapterId: text('chapter_id')
		.notNull()
		.references(() => chapters.id, { onDelete: 'cascade' }),
	actionType: varchar('action_type', { length: 50 }).notNull(),
	actionDetail: text('action_detail'),
	metadata: json('metadata').default({}),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const savedFilters = pgTable('saved_filters', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 100 }).notNull(),
	pageKey: varchar('page_key', { length: 50 }).notNull(),
	filterConfig: json('filter_config').notNull().default({}),
	isDefault: boolean('is_default').notNull().default(false),
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export type ReminderRule = typeof reminderRules.$inferSelect;
export type NewReminderRule = typeof reminderRules.$inferInsert;
export type ChapterTrace = typeof chapterTraces.$inferSelect;
export type NewChapterTrace = typeof chapterTraces.$inferInsert;
export type SavedFilter = typeof savedFilters.$inferSelect;
export type NewSavedFilter = typeof savedFilters.$inferInsert;
