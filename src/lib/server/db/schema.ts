import {
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgTable,
  primaryKey,
  jsonb
} from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  label: varchar('label', { length: 100 }).notNull()
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  label: varchar('label', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull()
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id).notNull()
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] })
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull()
});

export const complaints = pgTable('complaints', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorId: uuid('visitor_id').references(() => users.id).notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  description: text('description').notNull(),
  status: varchar('status', { length: 30 }).default('pending').notNull(),
  deadline: timestamp('deadline', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  isOverdue: boolean('is_overdue').default(false).notNull()
});

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  complaintId: uuid('complaint_id').references(() => complaints.id, { onDelete: 'cascade' }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 20 }).notNull(),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const complaintTags = pgTable('complaint_tags', {
  complaintId: uuid('complaint_id').references(() => complaints.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull()
}, (t) => [
  primaryKey({ columns: [t.complaintId, t.tagId] })
]);

export const escalationRecords = pgTable('escalation_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  complaintId: uuid('complaint_id').references(() => complaints.id, { onDelete: 'cascade' }).notNull(),
  fromUserId: uuid('from_user_id').references(() => users.id).notNull(),
  toUserId: uuid('to_user_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  level: integer('level').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const callbackResults = pgTable('callback_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  complaintId: uuid('complaint_id').references(() => complaints.id, { onDelete: 'cascade' }).notNull(),
  visitorSatisfied: boolean('visitor_satisfied').notNull(),
  comment: text('comment'),
  operatorId: uuid('operator_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const processingLogs = pgTable('processing_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  complaintId: uuid('complaint_id').references(() => complaints.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 30 }).notNull(),
  operatorId: uuid('operator_id').references(() => users.id).notNull(),
  detail: jsonb('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const reassignmentRecords = pgTable('reassignment_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  complaintId: uuid('complaint_id').references(() => complaints.id, { onDelete: 'cascade' }).notNull(),
  fromAssigneeId: uuid('from_assignee_id').references(() => users.id),
  toAssigneeId: uuid('to_assignee_id').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  operatorId: uuid('operator_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
