import {
  pgTable,
  text,
  varchar,
  timestamp,
  uuid,
  date,
  jsonb,
  integer,
  boolean,
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['doctor', 'nurse', 'receptionist', 'admin']);
export const patientStatusEnum = pgEnum('patient_status', ['active', 'inactive', 'archived']);
export const recordStatusEnum = pgEnum('record_status', ['draft', 'reviewing', 'confirmed', 'archived']);
export const treatmentStatusEnum = pgEnum('treatment_status', ['planned', 'in_progress', 'completed', 'cancelled']);
export const followupStatusEnum = pgEnum('followup_status', ['pending', 'completed', 'missed', 'cancelled']);
export const followupTypeEnum = pgEnum('followup_type', ['phone', 'visit', 'imaging', 'consultation']);
export const imagingTypeEnum = pgEnum('imaging_type', ['xray', 'cbct', 'intraoral', 'panoramic', 'other']);
export const exceptionSeverityEnum = pgEnum('exception_severity', ['low', 'medium', 'high', 'critical']);
export const exceptionStatusEnum = pgEnum('exception_status', ['open', 'investigating', 'resolved', 'closed']);
export const responsibilityTypeEnum = pgEnum('responsibility_type', ['patient', 'clinic', 'doctor', 'system', 'other']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('doctor'),
  hashedPassword: varchar('hashed_password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull()
});

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientNo: varchar('patient_no', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  gender: varchar('gender', { length: 10 }),
  birthDate: date('birth_date'),
  phone: varchar('phone', { length: 20 }),
  idCard: varchar('id_card', { length: 20 }),
  address: text('address'),
  status: patientStatusEnum('status').notNull().default('active'),
  remarks: text('remarks'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const medicalRecords = pgTable('medical_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  visitDate: date('visit_date').notNull(),
  chiefComplaint: text('chief_complaint'),
  diagnosis: text('diagnosis'),
  treatmentSummary: text('treatment_summary'),
  status: recordStatusEnum('status').notNull().default('draft'),
  doctorId: uuid('doctor_id').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const recordStatusHistory = pgTable('record_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  recordId: uuid('record_id')
    .notNull()
    .references(() => medicalRecords.id, { onDelete: 'cascade' }),
  fromStatus: recordStatusEnum('from_status'),
  toStatus: recordStatusEnum('to_status').notNull(),
  changedBy: uuid('changed_by').references(() => users.id),
  remark: text('remark'),
  changedAt: timestamp('changed_at').notNull().defaultNow()
});

export const treatmentPlans = pgTable('treatment_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  recordId: uuid('record_id').references(() => medicalRecords.id, {
    onDelete: 'set null'
  }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: treatmentStatusEnum('status').notNull().default('planned'),
  estimatedCost: integer('estimated_cost'),
  actualCost: integer('actual_cost'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  doctorId: uuid('doctor_id').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const followupTasks = pgTable('followup_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  treatmentPlanId: uuid('treatment_plan_id').references(() => treatmentPlans.id, {
    onDelete: 'set null'
  }),
  type: followupTypeEnum('type').notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  actualDate: timestamp('actual_date'),
  status: followupStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  result: text('result'),
  assigneeId: uuid('assignee_id').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const imagingAttachments = pgTable('imaging_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  recordId: uuid('record_id').references(() => medicalRecords.id, {
    onDelete: 'set null'
  }),
  treatmentPlanId: uuid('treatment_plan_id').references(() => treatmentPlans.id, {
    onDelete: 'set null'
  }),
  type: imagingTypeEnum('type').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileSize: integer('file_size'),
  description: text('description'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow()
});

export const exceptionOrders = pgTable('exception_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  followupTaskId: uuid('followup_task_id').references(() => followupTasks.id, {
    onDelete: 'set null'
  }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  severity: exceptionSeverityEnum('severity').notNull().default('medium'),
  status: exceptionStatusEnum('status').notNull().default('open'),
  impactScope: text('impact_scope'),
  responsibility: responsibilityTypeEnum('responsibility'),
  responsiblePerson: varchar('responsible_person', { length: 100 }),
  handlingResult: text('handling_result'),
  closedAt: timestamp('closed_at'),
  reportedBy: uuid('reported_by').references(() => users.id),
  handledBy: uuid('handled_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const exportLogs = pgTable('export_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  dataScope: jsonb('data_scope'),
  fileUrl: varchar('file_url', { length: 500 }),
  statisticalCaliber: text('statistical_caliber'),
  exportedBy: uuid('exported_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});
