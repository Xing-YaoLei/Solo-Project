import {
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	boolean,
	integer,
	jsonb,
	foreignKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userTable = pgTable('user', {
	id: uuid('id').primaryKey().defaultRandom(),
	username: varchar('username', { length: 64 }).notNull().unique(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	role: varchar('role', { length: 32 }).notNull().default('worker'),
	fullName: varchar('full_name', { length: 128 }).notNull(),
	phone: varchar('phone', { length: 20 }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const sessionTable = pgTable('session', {
	id: varchar('id', { length: 128 }).primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => userTable.id),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const projectTable = pgTable('project', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectNo: varchar('project_no', { length: 50 }).notNull().unique(),
	name: varchar('name', { length: 200 }).notNull(),
	address: varchar('address', { length: 500 }),
	customerName: varchar('customer_name', { length: 128 }).notNull(),
	customerPhone: varchar('customer_phone', { length: 20 }),
	projectManager: uuid('project_manager').references(() => userTable.id),
	status: varchar('status', { length: 32 }).notNull().default('ongoing'),
	startDate: timestamp('start_date', { withTimezone: true }),
	expectedEndDate: timestamp('expected_end_date', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const authorizationScopeTable = pgTable('authorization_scope', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id),
	scopeType: varchar('scope_type', { length: 64 }).notNull(),
	description: text('description'),
	authorizedBy: uuid('authorized_by').references(() => userTable.id),
	authorizedAt: timestamp('authorized_at', { withTimezone: true }),
	status: varchar('status', { length: 32 }).notNull().default('pending'),
	expiresAt: timestamp('expires_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const customerProfileTable = pgTable('customer_profile', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id)
		.unique(),
	idCardNo: varchar('id_card_no', { length: 32 }),
	address: varchar('address', { length: 500 }),
	email: varchar('email', { length: 128 }),
	emergencyContact: varchar('emergency_contact', { length: 128 }),
	emergencyPhone: varchar('emergency_phone', { length: 20 }),
	houseArea: integer('house_area'),
	houseType: varchar('house_type', { length: 64 }),
	decorationStyle: varchar('decoration_style', { length: 64 }),
	budget: integer('budget'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const changeRecordTable = pgTable('change_record', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id),
	changeType: varchar('change_type', { length: 64 }).notNull(),
	changeContent: text('change_content').notNull(),
	oldValue: jsonb('old_value'),
	newValue: jsonb('new_value'),
	reason: text('reason'),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => userTable.id),
	reviewStatus: varchar('review_status', { length: 32 }).notNull().default('pending'),
	reviewedBy: uuid('reviewed_by').references(() => userTable.id),
	reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
	reviewComment: text('review_comment'),
	customerConfirmed: boolean('customer_confirmed').notNull().default(false),
	customerConfirmedAt: timestamp('customer_confirmed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const documentCategoryTable = pgTable('document_category', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 128 }).notNull(),
	code: varchar('code', { length: 32 }).notNull().unique(),
	description: text('description'),
	required: boolean('required').notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const attachmentTable = pgTable('attachment', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id),
	categoryId: uuid('category_id').references(() => documentCategoryTable.id),
	changeRecordId: uuid('change_record_id').references(() => changeRecordTable.id),
	fileName: varchar('file_name', { length: 255 }).notNull(),
	filePath: varchar('file_path', { length: 500 }).notNull(),
	fileSize: integer('file_size'),
	fileType: varchar('file_type', { length: 64 }),
	uploadedBy: uuid('uploaded_by')
		.notNull()
		.references(() => userTable.id),
	description: text('description'),
	version: varchar('version', { length: 32 }).default('1.0'),
	isValid: boolean('is_valid').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const reviewOpinionTable = pgTable('review_opinion', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id),
	targetType: varchar('target_type', { length: 64 }).notNull(),
	targetId: uuid('target_id').notNull(),
	content: text('content').notNull(),
	reviewerId: uuid('reviewer_id')
		.notNull()
		.references(() => userTable.id),
	status: varchar('status', { length: 32 }).notNull().default('comment'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const communicationNoteTable = pgTable('communication_note', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id),
	reviewOpinionId: uuid('review_opinion_id').references(() => reviewOpinionTable.id),
	content: text('content').notNull(),
	communicatorId: uuid('communicator_id')
		.notNull()
		.references(() => userTable.id),
	communicationType: varchar('communication_type', { length: 32 }).notNull().default('internal'),
	customerInvolved: boolean('customer_involved').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const documentCompletenessLogTable = pgTable('document_completeness_log', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projectTable.id),
	completenessRate: integer('completeness_rate').notNull(),
	totalRequired: integer('total_required').notNull(),
	completedCount: integer('completed_count').notNull(),
	missingCategories: jsonb('missing_categories'),
	calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull().defaultNow()
});

export const projectRelations = relations(projectTable, ({ many, one }) => ({
	authorizations: many(authorizationScopeTable),
	customerProfile: one(customerProfileTable, {
		fields: [projectTable.id],
		references: [customerProfileTable.projectId]
	}),
	changeRecords: many(changeRecordTable),
	attachments: many(attachmentTable),
	reviewOpinions: many(reviewOpinionTable),
	communicationNotes: many(communicationNoteTable),
	completenessLogs: many(documentCompletenessLogTable),
	manager: one(userTable, {
		fields: [projectTable.projectManager],
		references: [userTable.id]
	})
}));

export const userRelations = relations(userTable, ({ many }) => ({
	managedProjects: many(projectTable, {
		relationName: 'project_manager'
	}),
	authorizations: many(authorizationScopeTable),
	createdChanges: many(changeRecordTable, {
		relationName: 'created_by'
	}),
	reviewedChanges: many(changeRecordTable, {
		relationName: 'reviewed_by'
	}),
	uploadedAttachments: many(attachmentTable),
	reviewOpinions: many(reviewOpinionTable),
	communicationNotes: many(communicationNoteTable)
}));

export const changeRecordRelations = relations(changeRecordTable, ({ one, many }) => ({
	project: one(projectTable, {
		fields: [changeRecordTable.projectId],
		references: [projectTable.id]
	}),
	creator: one(userTable, {
		fields: [changeRecordTable.createdBy],
		references: [userTable.id],
		relationName: 'created_by'
	}),
	reviewer: one(userTable, {
		fields: [changeRecordTable.reviewedBy],
		references: [userTable.id],
		relationName: 'reviewed_by'
	}),
	attachments: many(attachmentTable)
}));

export const attachmentRelations = relations(attachmentTable, ({ one }) => ({
	project: one(projectTable, {
		fields: [attachmentTable.projectId],
		references: [projectTable.id]
	}),
	category: one(documentCategoryTable, {
		fields: [attachmentTable.categoryId],
		references: [documentCategoryTable.id]
	}),
	changeRecord: one(changeRecordTable, {
		fields: [attachmentTable.changeRecordId],
		references: [changeRecordTable.id]
	}),
	uploader: one(userTable, {
		fields: [attachmentTable.uploadedBy],
		references: [userTable.id]
	})
}));

export const reviewOpinionRelations = relations(reviewOpinionTable, ({ one, many }) => ({
	project: one(projectTable, {
		fields: [reviewOpinionTable.projectId],
		references: [projectTable.id]
	}),
	reviewer: one(userTable, {
		fields: [reviewOpinionTable.reviewerId],
		references: [userTable.id]
	}),
	communicationNotes: many(communicationNoteTable)
}));

export const communicationNoteRelations = relations(communicationNoteTable, ({ one }) => ({
	project: one(projectTable, {
		fields: [communicationNoteTable.projectId],
		references: [projectTable.id]
	}),
	reviewOpinion: one(reviewOpinionTable, {
		fields: [communicationNoteTable.reviewOpinionId],
		references: [reviewOpinionTable.id]
	}),
	communicator: one(userTable, {
		fields: [communicationNoteTable.communicatorId],
		references: [userTable.id]
	})
}));

export type User = typeof userTable.$inferSelect;
export type NewUser = typeof userTable.$inferInsert;
export type Project = typeof projectTable.$inferSelect;
export type NewProject = typeof projectTable.$inferInsert;
export type AuthorizationScope = typeof authorizationScopeTable.$inferSelect;
export type NewAuthorizationScope = typeof authorizationScopeTable.$inferInsert;
export type CustomerProfile = typeof customerProfileTable.$inferSelect;
export type NewCustomerProfile = typeof customerProfileTable.$inferInsert;
export type ChangeRecord = typeof changeRecordTable.$inferSelect;
export type NewChangeRecord = typeof changeRecordTable.$inferInsert;
export type DocumentCategory = typeof documentCategoryTable.$inferSelect;
export type Attachment = typeof attachmentTable.$inferSelect;
export type NewAttachment = typeof attachmentTable.$inferInsert;
export type ReviewOpinion = typeof reviewOpinionTable.$inferSelect;
export type NewReviewOpinion = typeof reviewOpinionTable.$inferInsert;
export type CommunicationNote = typeof communicationNoteTable.$inferSelect;
export type NewCommunicationNote = typeof communicationNoteTable.$inferInsert;
export type DocumentCompletenessLog = typeof documentCompletenessLogTable.$inferSelect;
