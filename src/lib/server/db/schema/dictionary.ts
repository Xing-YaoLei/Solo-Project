import { pgTable, text, timestamp, integer, json, boolean, uuid } from 'drizzle-orm/pg-core';

export const timeoutDictionaryTable = pgTable('timeout_dictionary', {
	id: uuid('id').primaryKey().defaultRandom(),
	statusKey: text('status_key').notNull().unique(),
	statusName: text('status_name').notNull(),
	timeoutHours: integer('timeout_hours').notNull(),
	description: text('description'),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const escalationRuleTable = pgTable('escalation_rule', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	triggerCondition: text('trigger_condition').notNull(),
	escalateToRole: text('escalate_to_role').notNull(),
	escalateToUserId: text('escalate_to_user_id'),
	level: integer('level').notNull().default(1),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const followupThresholdTable = pgTable('followup_threshold', {
	id: uuid('id').primaryKey().defaultRandom(),
	resultKey: text('result_key').notNull().unique(),
	resultName: text('result_name').notNull(),
	requiresReview: boolean('requires_review').notNull().default(false),
	warningThreshold: integer('warning_threshold'),
	description: text('description'),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const issueTagTable = pgTable('issue_tag', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	category: text('category'),
	color: text('color'),
	sortOrder: integer('sort_order').default(0),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const responsibilityDictTable = pgTable('responsibility_dict', {
	id: uuid('id').primaryKey().defaultRandom(),
	key: text('key').notNull().unique(),
	name: text('name').notNull(),
	department: text('department'),
	sortOrder: integer('sort_order').default(0),
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow()
});
