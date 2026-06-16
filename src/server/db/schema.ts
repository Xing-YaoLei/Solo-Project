import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  foreignKey
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'supervisor', 'nurse', 'doctor', 'family']);
export const elderStatusEnum = pgEnum('elder_status', ['pending', 'admitted', 'discharged']);
export const genderEnum = pgEnum('gender', ['male', 'female']);
export const assessmentStatusEnum = pgEnum(
  'assessment_status',
  ['draft', 'collecting', 'evaluating', 'approving', 'archived', 'closed']
);
export const incidentTypeEnum = pgEnum('incident_type', ['fall', 'other']);
export const incidentStatusEnum = pgEnum(
  'incident_status', ['reported', 'supplementing', 'confirming', 'closed']);
export const partyRoleEnum = pgEnum('party_role', ['elder', 'nurse', 'supervisor', 'witness', 'doctor']);
export const entityTypeEnum = pgEnum(
  'entity_type',
  ['assessment', 'incident', 'elder', 'medication', 'visit']
);
export const flowEntityTypeEnum = pgEnum('flow_entity_type', ['assessment', 'incident']);
export const responsibilityTypeEnum = pgEnum('responsibility_type', ['direct', 'indirect']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull(),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
});

export const userSessions = pgTable('user_sessions', {
  id: varchar('id', { length: 128 }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activeExpiresAt: integer('active_expires_at').notNull(),
  idleExpiresAt: integer('idle_expires_at').notNull()
});

export const careLevels = pgTable('care_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  scoreRange: jsonb('score_range').notNull(),
  description: text('description'),
  careItems: jsonb('care_items').default(sql`'[]'::jsonb`),
  isActive: boolean('is_active').default(true)
});

export const elders = pgTable('elders', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  gender: genderEnum('gender').notNull(),
  birthDate: date('birth_date').notNull(),
  idCard: varchar('id_card', { length: 18 }).unique(),
  roomNumber: varchar('room_number', { length: 50 }),
  admissionDate: date('admission_date'),
  status: elderStatusEnum('status').default('pending'),
  careLevelId: uuid('care_level_id').references(() => careLevels.id),
  avatar: varchar('avatar', { length: 500 }),
  allergies: jsonb('allergies').default(sql`'[]'::jsonb`),
  medicalHistory: jsonb('medical_history').default(sql`'[]'::jsonb`),
  emergencyContact: jsonb('emergency_contact').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
});

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  elderId: uuid('elder_id')
    .notNull()
    .references(() => elders.id, { onDelete: 'cascade' }),
  status: assessmentStatusEnum('status').default('draft'),
  adlScore: integer('adl_score').default(0),
  cognitionScore: integer('cognition_score').default(0),
  emotionScore: integer('emotion_score').default(0),
  socialScore: integer('social_score').default(0),
  totalScore: integer('total_score').default(0),
  suggestedLevelId: uuid('suggested_level_id').references(() => careLevels.id),
  finalLevelId: uuid('final_level_id').references(() => careLevels.id),
  currentStep: integer('current_step').default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
});

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  elderId: uuid('elder_id')
    .notNull()
    .references(() => elders.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  dosage: varchar('dosage', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 100 }).notNull(),
  route: varchar('route', { length: 50 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  prescribedBy: varchar('prescribed_by', { length: 100 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true)
});

export const medicationExecutions = pgTable('medication_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  medicationId: uuid('medication_id')
    .notNull()
    .references(() => medications.id, { onDelete: 'cascade' }),
  executedAt: timestamp('executed_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  executedBy: varchar('executed_by', { length: 100 }).notNull(),
  signature: varchar('signature', { length: 500 }),
  isAbnormal: boolean('is_abnormal').default(false),
  abnormalNote: text('abnormal_note')
});

export const visitRecords = pgTable('visit_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  elderId: uuid('elder_id')
    .notNull()
    .references(() => elders.id, { onDelete: 'cascade' }),
  visitorName: varchar('visitor_name', { length: 100 }).notNull(),
  relation: varchar('relation', { length: 50 }),
  visitorPhone: varchar('visitor_phone', { length: 20 }),
  visitTime: timestamp('visit_time', { withTimezone: true })
    .defaultNow()
    .notNull(),
  leaveTime: timestamp('leave_time', { withTimezone: true }),
  notes: text('notes'),
  recordedBy: varchar('recorded_by', { length: 100 })
});

export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  elderId: uuid('elder_id')
    .notNull()
    .references(() => elders.id, { onDelete: 'cascade' }),
  type: incidentTypeEnum('type').default('fall'),
  status: incidentStatusEnum('status').default('reported'),
  reportedAt: timestamp('reported_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  reportedBy: varchar('reported_by', { length: 100 }),
  location: varchar('location', { length: 200 }),
  description: text('description'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  summary: text('summary'),
  correctiveActions: jsonb('corrective_actions').default(sql`'[]'::jsonb`)
});

export const incidentParties = pgTable('incident_parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id')
    .notNull()
    .references(() => incidents.id, { onDelete: 'cascade' }),
  roleType: partyRoleEnum('role_type').notNull(),
  userId: uuid('user_id').references(() => users.id),
  personName: varchar('person_name', { length: 100 }).notNull(),
  description: text('description'),
  supplementAt: timestamp('supplement_at', { withTimezone: true }),
  isResponsible: boolean('is_responsible'),
  responsibilityType: responsibilityTypeEnum('responsibility_type')
});

export const flowAttachments = pgTable('flow_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: entityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  uploadedBy: varchar('uploaded_by', { length: 100 }),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const flowRemarks = pgTable('flow_remarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: entityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  content: text('content').notNull(),
  createdBy: varchar('created_by', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const flowHandlers = pgTable('flow_handlers', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: flowEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  stepName: varchar('step_name', { length: 100 }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  userName: varchar('user_name', { length: 100 }).notNull(),
  handledAt: timestamp('handled_at', { withTimezone: true }),
  action: varchar('action', { length: 50 })
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CareLevel = typeof careLevels.$inferSelect;
export type Elder = typeof elders.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Medication = typeof medications.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type IncidentParty = typeof incidentParties.$inferSelect;
