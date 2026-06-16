import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  date,
  boolean,
  jsonb,
  primaryKey,
  foreignKey,
  uuid,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'pharmacist', 'staff']);
export const followupStatusEnum = pgEnum('followup_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);
export const prescriptionStatusEnum = pgEnum('prescription_status', ['clear', 'unclear', 'verified', 'rejected']);

export const users = pgTable('user', {
  id: text('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('staff'),
  pharmacyId: uuid('pharmacy_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const sessions = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp('expires_at').notNull()
});

export const pharmacies = pgTable('pharmacies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberNo: varchar('member_no', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  idCard: varchar('id_card', { length: 20 }),
  gender: varchar('gender', { length: 10 }),
  birthday: date('birthday', { mode: 'date' }),
  address: text('address'),
  allergyHistory: text('allergy_history'),
  medicalHistory: text('medical_history'),
  insuranceCardNo: varchar('insurance_card_no', { length: 50 }),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const drugs = pgTable('drugs', {
  id: uuid('id').primaryKey().defaultRandom(),
  drugCode: varchar('drug_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  genericName: varchar('generic_name', { length: 200 }),
  specification: varchar('specification', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 200 }),
  unit: varchar('unit', { length: 20 }),
  category: varchar('category', { length: 50 }),
  usage: text('usage'),
  caution: text('caution'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const drugBatches = pgTable('drug_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  drugId: uuid('drug_id').notNull().references(() => drugs.id),
  batchNo: varchar('batch_no', { length: 50 }).notNull(),
  productionDate: date('production_date', { mode: 'date' }),
  expiryDate: date('expiry_date', { mode: 'date' }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const replenishmentOrders = pgTable('replenishment_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNo: varchar('order_no', { length: 50 }).notNull().unique(),
  memberId: uuid('member_id').references(() => members.id),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  totalAmount: integer('total_amount').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: text('created_by').references(() => users.id)
});

export const replenishmentOrderItems = pgTable('replenishment_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => replenishmentOrders.id),
  drugId: uuid('drug_id').notNull().references(() => drugs.id),
  batchId: uuid('batch_id').references(() => drugBatches.id),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull()
});

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  prescriptionNo: varchar('prescription_no', { length: 50 }),
  hospital: varchar('hospital', { length: 200 }),
  doctor: varchar('doctor', { length: 50 }),
  issueDate: date('issue_date', { mode: 'date' }),
  status: prescriptionStatusEnum('status').notNull().default('clear'),
  riskLevel: riskLevelEnum('risk_level').notNull().default('low'),
  photoUrl: text('photo_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const prescriptionItems = pgTable('prescription_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  prescriptionId: uuid('prescription_id').notNull().references(() => prescriptions.id),
  drugId: uuid('drug_id').references(() => drugs.id),
  drugName: varchar('drug_name', { length: 200 }).notNull(),
  specification: varchar('specification', { length: 100 }),
  dosage: varchar('dosage', { length: 100 }),
  frequency: varchar('frequency', { length: 50 }),
  duration: varchar('duration', { length: 50 }),
  quantity: integer('quantity')
});

export const insuranceRecords = pgTable('insurance_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  recordNo: varchar('record_no', { length: 50 }).notNull().unique(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  prescriptionId: uuid('prescription_id').references(() => prescriptions.id),
  transactionDate: timestamp('transaction_date').notNull(),
  totalAmount: integer('total_amount').notNull(),
  insuranceAmount: integer('insurance_amount').notNull(),
  selfPayAmount: integer('self_pay_amount').notNull(),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const followupRecords = pgTable('followup_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id),
  prescriptionId: uuid('prescription_id').references(() => prescriptions.id),
  replenishmentOrderId: uuid('replenishment_order_id').references(() => replenishmentOrders.id),
  insuranceRecordId: uuid('insurance_record_id').references(() => insuranceRecords.id),
  status: followupStatusEnum('status').notNull().default('pending'),
  riskLevel: riskLevelEnum('risk_level').notNull().default('low'),
  assignedTo: text('assigned_to').references(() => users.id),
  pharmacyId: uuid('pharmacy_id').references(() => pharmacies.id),
  followupDate: timestamp('followup_date'),
  nextFollowupDate: timestamp('next_followup_date'),
  medicationAdherence: boolean('medication_adherence'),
  adverseReaction: boolean('adverse_reaction'),
  symptomImprovement: varchar('symptom_improvement', { length: 20 }),
  reviewOpinion: text('review_opinion'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by').references(() => users.id)
});

export const communicationNotes = pgTable('communication_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  followupRecordId: uuid('followup_record_id').notNull().references(() => followupRecords.id),
  content: text('content').notNull(),
  isReview: boolean('is_review').notNull().default(false),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const usersRelations = relations(users, ({ one, many }) => ({
  pharmacy: one(pharmacies, {
    fields: [users.pharmacyId],
    references: [pharmacies.id]
  }),
  assignedFollowups: many(followupRecords, { relationName: 'assigned' }),
  createdFollowups: many(followupRecords, { relationName: 'created' }),
  createdNotes: many(communicationNotes)
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  pharmacy: one(pharmacies, {
    fields: [members.pharmacyId],
    references: [pharmacies.id]
  }),
  followupRecords: many(followupRecords),
  prescriptions: many(prescriptions),
  insuranceRecords: many(insuranceRecords),
  replenishmentOrders: many(replenishmentOrders)
}));

export const followupRecordsRelations = relations(followupRecords, ({ one, many }) => ({
  member: one(members, {
    fields: [followupRecords.memberId],
    references: [members.id]
  }),
  prescription: one(prescriptions, {
    fields: [followupRecords.prescriptionId],
    references: [prescriptions.id]
  }),
  replenishmentOrder: one(replenishmentOrders, {
    fields: [followupRecords.replenishmentOrderId],
    references: [replenishmentOrders.id]
  }),
  insuranceRecord: one(insuranceRecords, {
    fields: [followupRecords.insuranceRecordId],
    references: [insuranceRecords.id]
  }),
  assignedUser: one(users, {
    fields: [followupRecords.assignedTo],
    references: [users.id],
    relationName: 'assigned'
  }),
  createdUser: one(users, {
    fields: [followupRecords.createdBy],
    references: [users.id],
    relationName: 'created'
  }),
  pharmacy: one(pharmacies, {
    fields: [followupRecords.pharmacyId],
    references: [pharmacies.id]
  }),
  notes: many(communicationNotes)
}));

export const drugBatchesRelations = relations(drugBatches, ({ one }) => ({
  drug: one(drugs, {
    fields: [drugBatches.drugId],
    references: [drugs.id]
  }),
  pharmacy: one(pharmacies, {
    fields: [drugBatches.pharmacyId],
    references: [pharmacies.id]
  })
}));

export const communicationNotesRelations = relations(communicationNotes, ({ one }) => ({
  followupRecord: one(followupRecords, {
    fields: [communicationNotes.followupRecordId],
    references: [followupRecords.id]
  }),
  createdBy: one(users, {
    fields: [communicationNotes.createdBy],
    references: [users.id]
  })
}));
