import {
	sqliteTable,
	text,
	integer,
	real,
	primaryKey,
	index,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export type UserRole = 'admin' | 'manager' | 'nurse' | 'caregiver';

export const users = sqliteTable(
	'user',
	{
		id: text('id').primaryKey().notNull(),
		username: text('username').notNull(),
		passwordHash: text('password_hash').notNull(),
		fullName: text('full_name').notNull(),
		role: text('role').$type<UserRole>().notNull().default('caregiver'),
		phone: text('phone'),
		avatar: text('avatar'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		usernameUnique: uniqueIndex('user_username_unique').on(t.username)
	})
);

export const sessions = sqliteTable(
	'session',
	{
		id: text('id').primaryKey().notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: integer('expires_at').notNull()
	}
);

export type CareLevel = 'independent' | 'semi_dependent' | 'dependent' | 'total_care';
export type Gender = 'male' | 'female' | 'other';

export const elderlyProfiles = sqliteTable(
	'elderly_profile',
	{
		id: text('id').primaryKey().notNull(),
		name: text('name').notNull(),
		gender: text('gender').$type<Gender>().notNull(),
		birthDate: integer('birth_date', { mode: 'timestamp_ms' }),
		age: integer('age'),
		idNumber: text('id_number'),
		roomNumber: text('room_number'),
		bedNumber: text('bed_number'),
		careLevel: text('care_level').$type<CareLevel>().notNull().default('independent'),
		primaryDisease: text('primary_disease'),
		allergyInfo: text('allergy_info'),
		emergencyContact: text('emergency_contact'),
		emergencyPhone: text('emergency_phone'),
		notes: text('notes'),
		avatar: text('avatar'),
		admissionDate: integer('admission_date', { mode: 'timestamp_ms' }),
		caregiverId: text('caregiver_id').references(() => users.id),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		caregiverIdx: index('elderly_caregiver_idx').on(t.caregiverId),
		careLevelIdx: index('elderly_care_level_idx').on(t.careLevel)
	})
);

export const medications = sqliteTable(
	'medication',
	{
		id: text('id').primaryKey().notNull(),
		elderlyId: text('elderly_id')
			.notNull()
			.references(() => elderlyProfiles.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		dosage: text('dosage').notNull(),
		frequency: text('frequency').notNull(),
		timesPerDay: integer('times_per_day').notNull().default(1),
		specificTimes: text('specific_times').notNull(),
		route: text('route').notNull().default('口服'),
		notes: text('notes'),
		doctorName: text('doctor_name'),
		startDate: integer('start_date', { mode: 'timestamp_ms' }),
		endDate: integer('end_date', { mode: 'timestamp_ms' }),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		elderlyIdx: index('med_elderly_idx').on(t.elderlyId),
		activeIdx: index('med_active_idx').on(t.isActive)
	})
);

export type ReminderStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export const medicationReminders = sqliteTable(
	'medication_reminder',
	{
		id: text('id').primaryKey().notNull(),
		medicationId: text('medication_id')
			.notNull()
			.references(() => medications.id, { onDelete: 'cascade' }),
		elderlyId: text('elderly_id')
			.notNull()
			.references(() => elderlyProfiles.id, { onDelete: 'cascade' }),
		scheduledTime: integer('scheduled_time', { mode: 'timestamp_ms' }).notNull(),
		actualTime: integer('actual_time', { mode: 'timestamp_ms' }),
		status: text('status').$type<ReminderStatus>().notNull().default('pending'),
		administeredBy: text('administered_by').references(() => users.id),
		notes: text('notes'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		scheduledIdx: index('reminder_scheduled_idx').on(t.scheduledTime),
		statusIdx: index('reminder_status_idx').on(t.status),
		elderlyIdx: index('reminder_elderly_idx').on(t.elderlyId)
	})
);

export type ActivityType =
	| 'morning_exercise'
	| 'recreational'
	| 'meal'
	| 'rest'
	| 'therapy'
	| 'walk'
	| 'other';

export const activityCheckins = sqliteTable(
	'activity_checkin',
	{
		id: text('id').primaryKey().notNull(),
		elderlyId: text('elderly_id')
			.notNull()
			.references(() => elderlyProfiles.id, { onDelete: 'cascade' }),
		activityType: text('activity_type').$type<ActivityType>().notNull(),
		activityName: text('activity_name').notNull(),
		checkinTime: integer('checkin_time', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		checkedInBy: text('checked_in_by')
			.notNull()
			.references(() => users.id),
		participationStatus: text('participation_status').notNull().default('participated'),
		durationMinutes: integer('duration_minutes'),
		notes: text('notes')
	},
	(t) => ({
		elderlyIdx: index('activity_elderly_idx').on(t.elderlyId),
		timeIdx: index('activity_time_idx').on(t.checkinTime)
	})
);

export type RiskEventType = 'fall' | 'illness' | 'medication_error' | 'wandering' | 'conflict' | 'other';
export type RiskEventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskEventStatus = 'reported' | 'investigating' | 'resolved' | 'closed';

export const riskEvents = sqliteTable(
	'risk_event',
	{
		id: text('id').primaryKey().notNull(),
		elderlyId: text('elderly_id')
			.notNull()
			.references(() => elderlyProfiles.id, { onDelete: 'cascade' }),
		eventType: text('event_type').$type<RiskEventType>().notNull(),
		severity: text('severity').$type<RiskEventSeverity>().notNull().default('medium'),
		status: text('status').$type<RiskEventStatus>().notNull().default('reported'),
		occurredAt: integer('occurred_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
		location: text('location'),
		reportedBy: text('reported_by')
			.notNull()
			.references(() => users.id),
		description: text('description').notNull(),
		immediateAction: text('immediate_action'),
		resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
		reviewStatus: text('review_status').notNull().default('pending'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		elderlyIdx: index('risk_elderly_idx').on(t.elderlyId),
		typeIdx: index('risk_type_idx').on(t.eventType),
		statusIdx: index('risk_status_idx').on(t.status),
		severityIdx: index('risk_severity_idx').on(t.severity)
	})
);

export type CommunicationType = 'internal_note' | 'family_call' | 'doctor_consult' | 'meeting';

export const communications = sqliteTable(
	'communication',
	{
		id: text('id').primaryKey().notNull(),
		riskEventId: text('risk_event_id')
			.notNull()
			.references(() => riskEvents.id, { onDelete: 'cascade' }),
		type: text('type').$type<CommunicationType>().notNull().default('internal_note'),
		content: text('content').notNull(),
		createdBy: text('created_by')
			.notNull()
			.references(() => users.id),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		eventIdx: index('comm_event_idx').on(t.riskEventId)
	})
);

export const reviewOpinions = sqliteTable(
	'review_opinion',
	{
		id: text('id').primaryKey().notNull(),
		riskEventId: text('risk_event_id')
			.notNull()
			.references(() => riskEvents.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		reviewedBy: text('reviewed_by')
			.notNull()
			.references(() => users.id),
		reviewResult: text('review_result').notNull().default('pending'),
		improvementSuggestions: text('improvement_suggestions'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		eventIdx: index('review_event_idx').on(t.riskEventId)
	})
);

export const careCompliance = sqliteTable(
	'care_compliance',
	{
		id: text('id').primaryKey().notNull(),
		elderlyId: text('elderly_id')
			.notNull()
			.references(() => elderlyProfiles.id, { onDelete: 'cascade' }),
		date: integer('date', { mode: 'timestamp_ms' }).notNull(),
		medicationComplianceRate: real('medication_compliance_rate').notNull().default(0),
		activityComplianceRate: real('activity_compliance_rate').notNull().default(0),
		overallComplianceRate: real('overall_compliance_rate').notNull().default(0),
		totalMedicationReminders: integer('total_med_reminders').notNull().default(0),
		completedMedicationReminders: integer('completed_med_reminders').notNull().default(0),
		totalActivities: integer('total_activities').notNull().default(0),
		completedActivities: integer('completed_activities').notNull().default(0),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(unixepoch() * 1000)`)
	},
	(t) => ({
		dateIdx: index('compliance_date_idx').on(t.date),
		elderlyIdx: index('compliance_elderly_idx').on(t.elderlyId)
	})
);
