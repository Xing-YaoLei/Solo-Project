import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql } from 'drizzle-orm';

const client = createClient({ url: 'file:local.db' });
const db = drizzle(client);

const createTablesSql = sql`
CREATE TABLE IF NOT EXISTS user (
	id TEXT PRIMARY KEY NOT NULL,
	username TEXT NOT NULL UNIQUE,
	real_name TEXT NOT NULL,
	email TEXT UNIQUE,
	phone TEXT,
	role TEXT NOT NULL DEFAULT 'viewer',
	avatar_url TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS session (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES user(id),
	expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS property (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	address TEXT NOT NULL,
	type TEXT NOT NULL DEFAULT 'apartment',
	bedrooms INTEGER NOT NULL DEFAULT 1,
	bathrooms INTEGER NOT NULL DEFAULT 1,
	area INTEGER,
	phone TEXT,
	owner_name TEXT,
	owner_phone TEXT,
	description TEXT,
	images TEXT,
	status TEXT NOT NULL DEFAULT 'active',
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	created_by_id TEXT REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS booking (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	guest_name TEXT NOT NULL,
	guest_phone TEXT NOT NULL,
	check_in_date INTEGER NOT NULL,
	check_out_date INTEGER NOT NULL,
	adults INTEGER NOT NULL DEFAULT 1,
	children INTEGER NOT NULL DEFAULT 0,
	source TEXT NOT NULL DEFAULT 'other',
	total_price INTEGER,
	status TEXT NOT NULL DEFAULT 'confirmed',
	notes TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS guest_document (
	id TEXT PRIMARY KEY NOT NULL,
	booking_id TEXT NOT NULL REFERENCES booking(id),
	guest_name TEXT NOT NULL,
	id_type TEXT NOT NULL DEFAULT 'id_card',
	id_number TEXT NOT NULL,
	id_front_url TEXT,
	id_back_url TEXT,
	verified_at INTEGER,
	verified_by_id TEXT REFERENCES user(id),
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS cleaning_task (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	booking_id TEXT REFERENCES booking(id),
	assigned_cleaner_id TEXT REFERENCES user(id),
	scheduled_date INTEGER NOT NULL,
	scheduled_start_time TEXT,
	deadline_time INTEGER,
	type TEXT NOT NULL DEFAULT 'checkout_cleaning',
	priority TEXT NOT NULL DEFAULT 'medium',
	description TEXT,
	checklist TEXT,
	status TEXT NOT NULL DEFAULT 'pending',
	actual_start_time INTEGER,
	actual_end_time INTEGER,
	verified_at INTEGER,
	verified_by_id TEXT REFERENCES user(id),
	quality_score INTEGER,
	photos TEXT,
	cleaner_notes TEXT,
	inspector_notes TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	created_by_id TEXT REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS task_status_history (
	id TEXT PRIMARY KEY NOT NULL,
	task_id TEXT NOT NULL REFERENCES cleaning_task(id),
	from_status TEXT,
	to_status TEXT NOT NULL,
	reason TEXT,
	changed_by_id TEXT REFERENCES user(id),
	changed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS complaint (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	booking_id TEXT REFERENCES booking(id),
	task_id TEXT REFERENCES cleaning_task(id),
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	severity TEXT NOT NULL DEFAULT 'medium',
	source TEXT NOT NULL DEFAULT 'guest',
	status TEXT NOT NULL DEFAULT 'open',
	tags TEXT,
	evidence_urls TEXT,
	review_rating INTEGER,
	review_platform TEXT,
	review_link TEXT,
	responsible_cleaner_id TEXT REFERENCES user(id),
	handler_id TEXT REFERENCES user(id),
	resolution TEXT,
	compensation INTEGER,
	filed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	resolved_at INTEGER,
	closed_at INTEGER,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS anomaly (
	id TEXT PRIMARY KEY NOT NULL,
	task_id TEXT NOT NULL REFERENCES cleaning_task(id),
	property_id TEXT NOT NULL REFERENCES property(id),
	type TEXT NOT NULL DEFAULT 'missed_cleaning',
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	impact_scope TEXT NOT NULL,
	impacted_bookings TEXT,
	impact_level TEXT NOT NULL DEFAULT 'medium',
	responsible_person_id TEXT REFERENCES user(id),
	responsible_role TEXT,
	discovered_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	discovered_by_id TEXT REFERENCES user(id),
	status TEXT NOT NULL DEFAULT 'pending',
	handling_measures TEXT,
	handling_result TEXT,
	handling_conclusion TEXT,
	handled_by_id TEXT REFERENCES user(id),
	handled_at INTEGER,
	closed_at INTEGER,
	penalty TEXT,
	compensation INTEGER,
	follow_up_required INTEGER NOT NULL DEFAULT 0,
	follow_up_notes TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS calendar_event (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	title TEXT NOT NULL,
	type TEXT NOT NULL,
	reference_id TEXT,
	start_date INTEGER NOT NULL,
	end_date INTEGER NOT NULL,
	is_all_day INTEGER NOT NULL DEFAULT 1,
	color TEXT,
	notes TEXT,
	created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
	updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
`;

async function main() {
	console.log('正在创建数据库表...');
	await db.run(createTablesSql);
	console.log('✅ 数据库表创建成功！');
	process.exit(0);
}

main().catch((e) => {
	console.error('创建数据库失败:', e);
	process.exit(1);
});
