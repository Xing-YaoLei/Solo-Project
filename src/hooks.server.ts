import type { Handle } from '@sveltejs/kit';
import { lucia } from '$server/auth';
import { client, db } from '$server/db';
import { sql } from 'drizzle-orm';

async function ensureDatabase() {
	try {
		const statements = [
			`CREATE TABLE IF NOT EXISTS "user" (
				"id" text PRIMARY KEY NOT NULL,
				"email" text NOT NULL UNIQUE,
				"username" text NOT NULL,
				"password_hash" text NOT NULL,
				"role" text NOT NULL DEFAULT 'staff',
				"avatar" text,
				"phone" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "session" (
				"id" text PRIMARY KEY NOT NULL,
				"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE cascade,
				"expires_at" integer NOT NULL
			)`,
			`CREATE TABLE IF NOT EXISTS "property" (
				"id" text PRIMARY KEY NOT NULL,
				"name" text NOT NULL,
				"address" text NOT NULL,
				"city" text NOT NULL,
				"type" text NOT NULL,
				"bedrooms" integer NOT NULL DEFAULT 1,
				"bathrooms" integer NOT NULL DEFAULT 1,
				"max_guests" integer NOT NULL DEFAULT 2,
				"area" real,
				"base_price" real NOT NULL DEFAULT 0,
				"cleaning_fee" real NOT NULL DEFAULT 0,
				"deposit_amount" real NOT NULL DEFAULT 0,
				"amenities" text,
				"images" text,
				"description" text,
				"status" text NOT NULL DEFAULT 'active',
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "order" (
				"id" text PRIMARY KEY NOT NULL,
				"order_no" text NOT NULL UNIQUE,
				"property_id" text NOT NULL REFERENCES "property"("id") ON DELETE cascade,
				"channel" text NOT NULL DEFAULT 'direct',
				"channel_order_no" text,
				"guest_name" text NOT NULL,
				"guest_phone" text NOT NULL,
				"guest_email" text,
				"guest_count" integer NOT NULL DEFAULT 1,
				"check_in_date" integer NOT NULL,
				"check_out_date" integer NOT NULL,
				"night_count" integer NOT NULL DEFAULT 1,
				"total_price" real NOT NULL DEFAULT 0,
				"cleaning_fee" real NOT NULL DEFAULT 0,
				"deposit_amount" real NOT NULL DEFAULT 0,
				"channel_fee" real NOT NULL DEFAULT 0,
				"status" text NOT NULL DEFAULT 'pending',
				"payment_status" text NOT NULL DEFAULT 'unpaid',
				"paid_amount" real NOT NULL DEFAULT 0,
				"source" text NOT NULL DEFAULT 'online',
				"contact_person" text,
				"contact_phone" text,
				"remark" text,
				"internal_note" text,
				"created_by" text REFERENCES "user"("id"),
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "room_calendar" (
				"id" text PRIMARY KEY NOT NULL,
				"property_id" text NOT NULL REFERENCES "property"("id") ON DELETE cascade,
				"date" integer NOT NULL,
				"status" text NOT NULL DEFAULT 'available',
				"order_id" text REFERENCES "order"("id"),
				"price" real,
				"notes" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "cleaning_task" (
				"id" text PRIMARY KEY NOT NULL,
				"task_no" text NOT NULL UNIQUE,
				"property_id" text NOT NULL REFERENCES "property"("id") ON DELETE cascade,
				"order_id" text REFERENCES "order"("id"),
				"type" text NOT NULL DEFAULT 'checkout',
				"status" text NOT NULL DEFAULT 'pending',
				"priority" text NOT NULL DEFAULT 'medium',
				"scheduled_date" integer NOT NULL,
				"scheduled_time" text,
				"actual_start" integer,
				"actual_end" integer,
				"assigned_to" text REFERENCES "user"("id"),
				"fee" real NOT NULL DEFAULT 0,
				"items" text,
				"before_photos" text,
				"after_photos" text,
				"checklist" text,
				"inspector_note" text,
				"cleaner_note" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "guest_registration" (
				"id" text PRIMARY KEY NOT NULL,
				"property_id" text NOT NULL REFERENCES "property"("id") ON DELETE cascade,
				"order_id" text REFERENCES "order"("id"),
				"full_name" text NOT NULL,
				"id_type" text NOT NULL DEFAULT 'id_card',
				"id_number" text NOT NULL,
				"nationality" text DEFAULT 'CN',
				"gender" text,
				"birth_date" integer,
				"address" text,
				"phone" text,
				"id_front_photo" text,
				"id_back_photo" text,
				"face_photo" text,
				"is_primary" integer NOT NULL DEFAULT 0,
				"check_in_at" integer,
				"check_out_at" integer,
				"remark" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "deposit" (
				"id" text PRIMARY KEY NOT NULL,
				"deposit_no" text NOT NULL UNIQUE,
				"property_id" text NOT NULL REFERENCES "property"("id") ON DELETE cascade,
				"order_id" text REFERENCES "order"("id"),
				"guest_name" text NOT NULL,
				"amount" real NOT NULL DEFAULT 0,
				"status" text NOT NULL DEFAULT 'collected',
				"payment_method" text NOT NULL DEFAULT 'wechat',
				"transaction_no" text,
				"collected_at" integer,
				"refunded_amount" real NOT NULL DEFAULT 0,
				"deducted_amount" real NOT NULL DEFAULT 0,
				"deduction_items" text,
				"refund_method" text,
				"refund_transaction_no" text,
				"refunded_at" integer,
				"photos" text,
				"remark" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "exception_order" (
				"id" text PRIMARY KEY NOT NULL,
				"exception_no" text NOT NULL UNIQUE,
				"type" text NOT NULL DEFAULT 'status_conflict',
				"status" text NOT NULL DEFAULT 'open',
				"severity" text NOT NULL DEFAULT 'medium',
				"title" text NOT NULL,
				"description" text NOT NULL,
				"property_id" text REFERENCES "property"("id"),
				"order_id" text REFERENCES "order"("id"),
				"conflicting_order_id" text REFERENCES "order"("id"),
				"affected_start_date" integer,
				"affected_end_date" integer,
				"affected_nights" integer DEFAULT 0,
				"impact_scope" text,
				"root_cause" text,
				"resolution" text,
				"owner_id" text REFERENCES "user"("id"),
				"responder_id" text REFERENCES "user"("id"),
				"financial_impact" real DEFAULT 0,
				"compensation_amount" real DEFAULT 0,
				"evidence" text,
				"conclusion" text,
				"created_by" text NOT NULL REFERENCES "user"("id"),
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				"resolved_at" integer,
				"closed_at" integer,
				"updated_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`,
			`CREATE TABLE IF NOT EXISTS "exception_responsible" (
				"id" text NOT NULL,
				"exception_id" text NOT NULL REFERENCES "exception_order"("id") ON DELETE cascade,
				"user_id" text NOT NULL REFERENCES "user"("id"),
				"role" text NOT NULL,
				"responsibility_description" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000),
				PRIMARY KEY("exception_id", "user_id")
			)`,
			`CREATE TABLE IF NOT EXISTS "audit_log" (
				"id" text PRIMARY KEY NOT NULL,
				"user_id" text REFERENCES "user"("id"),
				"action" text NOT NULL,
				"entity_type" text NOT NULL,
				"entity_id" text NOT NULL,
				"field" text,
				"old_value" text,
				"new_value" text,
				"meta" text,
				"ip" text,
				"user_agent" text,
				"created_at" integer NOT NULL DEFAULT (strftime('%s','now') * 1000)
			)`
		];
		for (const s of statements) {
			try {
				await client.execute(s);
			} catch (e) {
				// 表已存在
			}
		}
	} catch (e) {
		console.error('DB init error:', e);
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	await ensureDatabase();

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await lucia.validateSession(sessionId);
		try {
			if (session && session.fresh) {
				const cookie = lucia.createSessionCookie(session.id);
				event.cookies.set(cookie.name, cookie.value, {
					path: '.',
					...cookie.attributes
				});
			}
			if (!session) {
				const cookie = lucia.createBlankSessionCookie();
				event.cookies.set(cookie.name, cookie.value, {
					path: '.',
					...cookie.attributes
				});
			}
		} catch {}
		event.locals.user = user;
		event.locals.session = session;
	}

	return resolve(event);
};
