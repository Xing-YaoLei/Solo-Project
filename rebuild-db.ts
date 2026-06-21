import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { Argon2id } from 'oslo/password';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/minsu_cleaning';
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

console.log('开始清理并重建数据库...');

const allTables = [
  'anomaly', 'complaint', 'task_status_history', 'calendar_event',
  'guest_document', 'cleaning_task', 'booking', 'property',
  'session', '"user"'
];

for (const t of allTables) {
  try {
    await client.unsafe(`DROP TABLE IF EXISTS ${t} CASCADE`);
    console.log(`  🗑️  删除旧表 ${t.replace(/"/g, '')}`);
  } catch (e) {}
}

const allEnums = [
  'calendar_event_type', 'anomaly_status', 'anomaly_impact_level', 'anomaly_type',
  'complaint_status', 'complaint_source', 'complaint_severity', 'task_status',
  'task_priority', 'task_type', 'id_type', 'booking_status', 'booking_source',
  'property_status', 'property_type', 'user_role'
];

for (const e of allEnums) {
  try {
    await client.unsafe(`DROP TYPE IF EXISTS ${e} CASCADE`);
    console.log(`  🗑️  删除旧枚举类型 ${e}`);
  } catch (ex) {}
}

console.log('\n开始创建枚举类型...');

const enumTypes = [
  `CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cleaner', 'viewer')`,
  `CREATE TYPE property_type AS ENUM ('apartment', 'house', 'villa', 'room')`,
  `CREATE TYPE property_status AS ENUM ('active', 'maintenance', 'inactive')`,
  `CREATE TYPE booking_source AS ENUM ('airbnb', 'tujia', 'xiaozhu', 'meituan', 'direct', 'other')`,
  `CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled')`,
  `CREATE TYPE id_type AS ENUM ('id_card', 'passport', 'driver_license', 'other')`,
  `CREATE TYPE task_type AS ENUM ('checkout_cleaning', 'periodic_cleaning', 'deep_cleaning', 'maintenance')`,
  `CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent')`,
  `CREATE TYPE task_status AS ENUM ('pending', 'assigned', 'accepted', 'in_progress', 'completed', 'verified', 'cancelled', 'missed')`,
  `CREATE TYPE complaint_severity AS ENUM ('low', 'medium', 'high', 'critical')`,
  `CREATE TYPE complaint_source AS ENUM ('guest', 'platform_review', 'owner', 'inspection', 'other')`,
  `CREATE TYPE complaint_status AS ENUM ('open', 'investigating', 'resolved', 'closed')`,
  `CREATE TYPE anomaly_type AS ENUM ('missed_cleaning', 'late_cleaning', 'quality_issue', 'no_show', 'other')`,
  `CREATE TYPE anomaly_impact_level AS ENUM ('low', 'medium', 'high', 'critical')`,
  `CREATE TYPE anomaly_status AS ENUM ('pending', 'handling', 'resolved', 'closed')`,
  `CREATE TYPE calendar_event_type AS ENUM ('booking', 'cleaning', 'maintenance', 'other')`
];
for (const t of enumTypes) {
  await client.unsafe(t);
}
console.log('✅ 16个枚举类型创建完成');

console.log('\n开始创建新表...');

const tables = [
`CREATE TABLE IF NOT EXISTS "user" (
	id TEXT PRIMARY KEY NOT NULL,
	username TEXT NOT NULL UNIQUE,
	real_name TEXT NOT NULL,
	password_hash TEXT,
	email TEXT UNIQUE,
	phone TEXT,
	role user_role NOT NULL DEFAULT 'viewer',
	avatar_url TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS session (
	id TEXT PRIMARY KEY NOT NULL,
	user_id TEXT NOT NULL REFERENCES "user"(id),
	expires_at TIMESTAMPTZ NOT NULL
)`,
`CREATE TABLE IF NOT EXISTS property (
	id TEXT PRIMARY KEY NOT NULL,
	name TEXT NOT NULL,
	address TEXT NOT NULL,
	type property_type NOT NULL DEFAULT 'apartment',
	bedrooms INTEGER NOT NULL DEFAULT 1,
	bathrooms INTEGER NOT NULL DEFAULT 1,
	area INTEGER,
	phone TEXT,
	owner_name TEXT,
	owner_phone TEXT,
	description TEXT,
	images TEXT[],
	status property_status NOT NULL DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	created_by_id TEXT REFERENCES "user"(id)
)`,
`CREATE TABLE IF NOT EXISTS booking (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	guest_name TEXT NOT NULL,
	guest_phone TEXT NOT NULL,
	check_in_date TIMESTAMPTZ NOT NULL,
	check_out_date TIMESTAMPTZ NOT NULL,
	adults INTEGER NOT NULL DEFAULT 1,
	children INTEGER NOT NULL DEFAULT 0,
	source booking_source NOT NULL DEFAULT 'other',
	total_price INTEGER,
	status booking_status NOT NULL DEFAULT 'confirmed',
	notes TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS guest_document (
	id TEXT PRIMARY KEY NOT NULL,
	booking_id TEXT NOT NULL REFERENCES booking(id),
	guest_name TEXT NOT NULL,
	id_type id_type NOT NULL DEFAULT 'id_card',
	id_number TEXT NOT NULL,
	id_front_url TEXT,
	id_back_url TEXT,
	verified_at TIMESTAMPTZ,
	verified_by_id TEXT REFERENCES "user"(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS cleaning_task (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	booking_id TEXT REFERENCES booking(id),
	assigned_cleaner_id TEXT REFERENCES "user"(id),
	scheduled_date TIMESTAMPTZ NOT NULL,
	scheduled_start_time TEXT,
	deadline_time TIMESTAMPTZ,
	type task_type NOT NULL DEFAULT 'checkout_cleaning',
	priority task_priority NOT NULL DEFAULT 'medium',
	description TEXT,
	checklist TEXT[],
	status task_status NOT NULL DEFAULT 'pending',
	actual_start_time TIMESTAMPTZ,
	actual_end_time TIMESTAMPTZ,
	verified_at TIMESTAMPTZ,
	verified_by_id TEXT REFERENCES "user"(id),
	quality_score INTEGER,
	photos TEXT[],
	cleaner_notes TEXT,
	inspector_notes TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	created_by_id TEXT REFERENCES "user"(id)
)`,
`CREATE TABLE IF NOT EXISTS task_status_history (
	id TEXT PRIMARY KEY NOT NULL,
	task_id TEXT NOT NULL REFERENCES cleaning_task(id),
	from_status task_status,
	to_status task_status NOT NULL,
	reason TEXT,
	changed_by_id TEXT REFERENCES "user"(id),
	changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS complaint (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	booking_id TEXT REFERENCES booking(id),
	task_id TEXT REFERENCES cleaning_task(id),
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	severity complaint_severity NOT NULL DEFAULT 'medium',
	source complaint_source NOT NULL DEFAULT 'guest',
	status complaint_status NOT NULL DEFAULT 'open',
	tags TEXT[],
	evidence_urls TEXT[],
	review_rating INTEGER,
	review_platform TEXT,
	review_link TEXT,
	responsible_cleaner_id TEXT REFERENCES "user"(id),
	handler_id TEXT REFERENCES "user"(id),
	resolution TEXT,
	compensation INTEGER,
	filed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	resolved_at TIMESTAMPTZ,
	closed_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS anomaly (
	id TEXT PRIMARY KEY NOT NULL,
	task_id TEXT NOT NULL REFERENCES cleaning_task(id),
	property_id TEXT NOT NULL REFERENCES property(id),
	type anomaly_type NOT NULL DEFAULT 'missed_cleaning',
	title TEXT NOT NULL,
	description TEXT NOT NULL,
	impact_scope TEXT NOT NULL,
	impacted_bookings TEXT[],
	impact_level anomaly_impact_level NOT NULL DEFAULT 'medium',
	responsible_person_id TEXT REFERENCES "user"(id),
	responsible_role TEXT,
	discovered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	discovered_by_id TEXT REFERENCES "user"(id),
	status anomaly_status NOT NULL DEFAULT 'pending',
	handling_measures TEXT,
	handling_result TEXT,
	handling_conclusion TEXT,
	handled_by_id TEXT REFERENCES "user"(id),
	handled_at TIMESTAMPTZ,
	closed_at TIMESTAMPTZ,
	penalty TEXT,
	compensation INTEGER,
	follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
	follow_up_notes TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`,
`CREATE TABLE IF NOT EXISTS calendar_event (
	id TEXT PRIMARY KEY NOT NULL,
	property_id TEXT NOT NULL REFERENCES property(id),
	title TEXT NOT NULL,
	type calendar_event_type NOT NULL,
	reference_id TEXT,
	start_date TIMESTAMPTZ NOT NULL,
	end_date TIMESTAMPTZ NOT NULL,
	is_all_day BOOLEAN NOT NULL DEFAULT TRUE,
	color TEXT,
	notes TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
)`
];

for (const t of tables) {
  await client.unsafe(t);
}
console.log('✅ 10张表创建完成');

const now = new Date();
const day = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(now.getTime() + n * day);

const hashedPassword = await new Argon2id().hash('123456');
console.log('🔑 默认密码 123456 已加密');

const users = [
  { id: generateIdFromEntropySize(16), username: 'admin', realName: '系统管理员', email: 'admin@minsu.com', phone: '13800000001', role: 'admin' as const },
  { id: generateIdFromEntropySize(16), username: 'manager', realName: '王经理', email: 'manager@minsu.com', phone: '13800000002', role: 'manager' as const },
  { id: generateIdFromEntropySize(16), username: 'cleaner1', realName: '张阿姨', email: null, phone: '13800000003', role: 'cleaner' as const },
  { id: generateIdFromEntropySize(16), username: 'cleaner2', realName: '李阿姨', email: null, phone: '13800000004', role: 'cleaner' as const },
  { id: generateIdFromEntropySize(16), username: 'cleaner3', realName: '赵师傅', email: null, phone: '13800000005', role: 'cleaner' as const },
  { id: generateIdFromEntropySize(16), username: 'viewer', realName: '查看者', email: 'viewer@minsu.com', phone: null, role: 'viewer' as const }
];
for (const u of users) {
  await db.execute(sql`INSERT INTO "user" (id, username, real_name, password_hash, email, phone, role, created_at, updated_at) VALUES (${u.id}, ${u.username}, ${u.realName}, ${hashedPassword}, ${u.email}, ${u.phone}, ${u.role}::user_role, ${now.toISOString()}::TIMESTAMPTZ, ${now.toISOString()}::TIMESTAMPTZ)`);
}
console.log('👤 6个用户数据插入完成 (密码: 123456)');

const [adminId, managerId, cleaner1Id, cleaner2Id, cleaner3Id] = users.map(u => u.id);

const properties = [
  { id: generateIdFromEntropySize(16), name: '西湖畔·观景公寓', address: '杭州市西湖区文三路100号', type: 'apartment' as const, bedrooms: 2, bathrooms: 1, area: 85, phone: '0571-88888888', ownerName: '陈业主', ownerPhone: '13900000001' },
  { id: generateIdFromEntropySize(16), name: '滨江·豪华三居室', address: '杭州市滨江区江南大道500号', type: 'apartment' as const, bedrooms: 3, bathrooms: 2, area: 120, phone: '0571-88888889', ownerName: '林业主', ownerPhone: '13900000002' },
  { id: generateIdFromEntropySize(16), name: '灵隐·私家别墅', address: '杭州市西湖区灵隐路88号', type: 'villa' as const, bedrooms: 4, bathrooms: 3, area: 280, phone: '0571-88888890', ownerName: '周业主', ownerPhone: '13900000003' },
  { id: generateIdFromEntropySize(16), name: '武林·温馨两居', address: '杭州市下城区武林广场10号', type: 'apartment' as const, bedrooms: 2, bathrooms: 1, area: 75, phone: '0571-88888891', ownerName: '吴业主', ownerPhone: '13900000004' },
  { id: generateIdFromEntropySize(16), name: '钱江新城·江景房', address: '杭州市上城区钱江路200号', type: 'house' as const, bedrooms: 3, bathrooms: 2, area: 140, phone: '0571-88888892', ownerName: '郑业主', ownerPhone: '13900000005' },
  { id: generateIdFromEntropySize(16), name: '黄龙·商务套房', address: '杭州市西湖区黄龙路100号', type: 'room' as const, bedrooms: 1, bathrooms: 1, area: 45, phone: '0571-88888893', ownerName: '孙业主', ownerPhone: '13900000006' }
];
for (const p of properties) {
  await db.execute(sql`INSERT INTO property (id, name, address, type, bedrooms, bathrooms, area, phone, owner_name, owner_phone, status, created_at, updated_at, created_by_id) VALUES (${p.id}, ${p.name}, ${p.address}, ${p.type}::property_type, ${p.bedrooms}, ${p.bathrooms}, ${p.area}, ${p.phone}, ${p.ownerName}, ${p.ownerPhone}, 'active'::property_status, ${now.toISOString()}::TIMESTAMPTZ, ${now.toISOString()}::TIMESTAMPTZ, ${adminId})`);
}
console.log('🏠 6套房源插入完成');

const [prop1, prop2, prop3, prop4, prop5, prop6] = properties.map(p => p.id);

const bookings = [
  { id: generateIdFromEntropySize(16), propertyId: prop1, guestName: '刘强', guestPhone: '13911110001', checkInDate: daysFromNow(-2), checkOutDate: daysFromNow(1), adults: 2, children: 1, source: 'airbnb' as const, totalPrice: 1280, status: 'checked_in' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop2, guestName: '王丽', guestPhone: '13911110002', checkInDate: daysFromNow(0), checkOutDate: daysFromNow(2), adults: 2, children: 0, source: 'tujia' as const, totalPrice: 2280, status: 'confirmed' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop3, guestName: '张伟', guestPhone: '13911110003', checkInDate: daysFromNow(-5), checkOutDate: daysFromNow(-2), adults: 4, children: 2, source: 'meituan' as const, totalPrice: 6800, status: 'checked_out' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop4, guestName: '陈芳', guestPhone: '13911110004', checkInDate: daysFromNow(1), checkOutDate: daysFromNow(3), adults: 2, children: 0, source: 'xiaozhu' as const, totalPrice: 960, status: 'confirmed' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop5, guestName: '杨磊', guestPhone: '13911110005', checkInDate: daysFromNow(-1), checkOutDate: daysFromNow(3), adults: 3, children: 1, source: 'direct' as const, totalPrice: 4520, status: 'checked_in' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop6, guestName: '赵敏', guestPhone: '13911110006', checkInDate: daysFromNow(3), checkOutDate: daysFromNow(5), adults: 1, children: 0, source: 'airbnb' as const, totalPrice: 780, status: 'confirmed' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop1, guestName: '周杰', guestPhone: '13911110007', checkInDate: daysFromNow(-8), checkOutDate: daysFromNow(-5), adults: 2, children: 0, source: 'airbnb' as const, totalPrice: 1200, status: 'checked_out' as const },
  { id: generateIdFromEntropySize(16), propertyId: prop3, guestName: '吴婷', guestPhone: '13911110008', checkInDate: daysFromNow(2), checkOutDate: daysFromNow(6), adults: 5, children: 3, source: 'tujia' as const, totalPrice: 12800, status: 'confirmed' as const }
];
for (const b of bookings) {
  await db.execute(sql`INSERT INTO booking (id, property_id, guest_name, guest_phone, check_in_date, check_out_date, adults, children, source, total_price, status, created_at, updated_at) VALUES (${b.id}, ${b.propertyId}, ${b.guestName}, ${b.guestPhone}, ${b.checkInDate.toISOString()}::TIMESTAMPTZ, ${b.checkOutDate.toISOString()}::TIMESTAMPTZ, ${b.adults}, ${b.children}, ${b.source}::booking_source, ${b.totalPrice}, ${b.status}::booking_status, ${now.toISOString()}::TIMESTAMPTZ, ${now.toISOString()}::TIMESTAMPTZ)`);
}
console.log('📝 8个预订插入完成');

const [booking1, booking2, booking3, booking4, booking5, booking6, booking7, booking8] = bookings.map(b => b.id);

const docs = [
  { id: generateIdFromEntropySize(16), bookingId: booking3, guestName: '张伟', idType: 'id_card' as const, idNumber: '330100199001011234' },
  { id: generateIdFromEntropySize(16), bookingId: booking3, guestName: '李娜', idType: 'id_card' as const, idNumber: '330100199202024321' },
  { id: generateIdFromEntropySize(16), bookingId: booking1, guestName: '刘强', idType: 'id_card' as const, idNumber: '110100198808085678', verifiedAt: daysFromNow(-1), verifiedById: managerId },
  { id: generateIdFromEntropySize(16), bookingId: booking7, guestName: '周杰', idType: 'passport' as const, idNumber: 'E12345678', verifiedAt: daysFromNow(-7), verifiedById: managerId }
];
for (const d of docs) {
  await db.execute(sql`INSERT INTO guest_document (id, booking_id, guest_name, id_type, id_number, verified_at, verified_by_id, created_at) VALUES (${d.id}, ${d.bookingId}, ${d.guestName}, ${d.idType}::id_type, ${d.idNumber}, ${d.verifiedAt ? d.verifiedAt.toISOString() : null}::TIMESTAMPTZ, ${d.verifiedById || null}, ${daysFromNow(-1).toISOString()}::TIMESTAMPTZ)`);
}
console.log('🪪 4份入住证件插入完成');

const taskDefaultDesc = ['退房后标准清洁', '季度深度清洁，包括油烟机、空调清洗', '例行设施检查保养'];
const defaultChecklistSql = sql`ARRAY['卫生间消毒', '床单更换', '地面清洁', '垃圾清理', '厨房擦拭']::TEXT[]`;

const tasks = [
  { id: generateIdFromEntropySize(16), propertyId: prop1, bookingId: booking7, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(-5), type: 'checkout_cleaning' as const, priority: 'high' as const, status: 'verified' as const, actualStartTime: new Date(daysFromNow(-5).getTime() + 9 * 3600000), actualEndTime: new Date(daysFromNow(-5).getTime() + 12 * 3600000), deadlineTime: new Date(daysFromNow(-5).getTime() + 14 * 3600000), verifiedAt: new Date(daysFromNow(-5).getTime() + 13 * 3600000), verifiedById: managerId, qualityScore: 95, createdAt: daysFromNow(-6), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop3, bookingId: booking3, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(-2), type: 'checkout_cleaning' as const, priority: 'urgent' as const, status: 'completed' as const, actualStartTime: new Date(daysFromNow(-2).getTime() + 8 * 3600000), actualEndTime: new Date(daysFromNow(-2).getTime() + 13 * 3600000), deadlineTime: new Date(daysFromNow(-2).getTime() + 12 * 3600000), createdAt: daysFromNow(-3), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop1, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(1), type: 'checkout_cleaning' as const, priority: 'high' as const, status: 'assigned' as const, deadlineTime: new Date(daysFromNow(1).getTime() + 14 * 3600000), createdAt: daysFromNow(-1), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop2, bookingId: booking2, assignedCleanerId: cleaner3Id, scheduledDate: daysFromNow(2), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'assigned' as const, deadlineTime: new Date(daysFromNow(2).getTime() + 14 * 3600000), createdAt: daysFromNow(0), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop4, bookingId: booking4, scheduledDate: daysFromNow(3), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'pending' as const, deadlineTime: new Date(daysFromNow(3).getTime() + 14 * 3600000), createdAt: daysFromNow(0), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop5, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(0), type: 'periodic_cleaning' as const, priority: 'low' as const, status: 'in_progress' as const, actualStartTime: new Date(now.getTime() - 3600000), createdAt: daysFromNow(-1), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop2, assignedCleanerId: cleaner3Id, scheduledDate: daysFromNow(-4), type: 'checkout_cleaning' as const, priority: 'high' as const, status: 'missed' as const, deadlineTime: new Date(daysFromNow(-4).getTime() + 14 * 3600000), createdAt: daysFromNow(-5), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop6, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(5), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'pending' as const, deadlineTime: new Date(daysFromNow(5).getTime() + 14 * 3600000), createdAt: daysFromNow(0), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop3, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(7), type: 'deep_cleaning' as const, priority: 'high' as const, status: 'assigned' as const, deadlineTime: new Date(daysFromNow(7).getTime() + 18 * 3600000), createdAt: daysFromNow(-1), descIdx: 1 },
  { id: generateIdFromEntropySize(16), propertyId: prop5, bookingId: booking5, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(3), type: 'checkout_cleaning' as const, priority: 'urgent' as const, status: 'assigned' as const, deadlineTime: new Date(daysFromNow(3).getTime() + 12 * 3600000), createdAt: daysFromNow(0), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop4, assignedCleanerId: cleaner3Id, scheduledDate: daysFromNow(-1), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'accepted' as const, deadlineTime: new Date(daysFromNow(-1).getTime() + 14 * 3600000), createdAt: daysFromNow(-2), descIdx: 0 },
  { id: generateIdFromEntropySize(16), propertyId: prop6, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(-6), type: 'maintenance' as const, priority: 'low' as const, status: 'verified' as const, actualStartTime: new Date(daysFromNow(-6).getTime() + 10 * 3600000), actualEndTime: new Date(daysFromNow(-6).getTime() + 11 * 3600000), deadlineTime: new Date(daysFromNow(-6).getTime() + 16 * 3600000), verifiedAt: new Date(daysFromNow(-6).getTime() + 12 * 3600000), verifiedById: managerId, qualityScore: 88, createdAt: daysFromNow(-7), descIdx: 2 }
];
for (const t of tasks) {
  const desc = taskDefaultDesc[t.descIdx || 0];
  await db.execute(sql`INSERT INTO cleaning_task (id, property_id, booking_id, assigned_cleaner_id, scheduled_date, deadline_time, type, priority, description, checklist, status, actual_start_time, actual_end_time, verified_at, verified_by_id, quality_score, created_at, updated_at, created_by_id) VALUES (${t.id}, ${t.propertyId}, ${t.bookingId || null}, ${t.assignedCleanerId || null}, ${t.scheduledDate.toISOString()}::TIMESTAMPTZ, ${t.deadlineTime ? t.deadlineTime.toISOString() : null}::TIMESTAMPTZ, ${t.type}::task_type, ${t.priority}::task_priority, ${desc}, ${defaultChecklistSql}, ${t.status}::task_status, ${t.actualStartTime ? t.actualStartTime.toISOString() : null}::TIMESTAMPTZ, ${t.actualEndTime ? t.actualEndTime.toISOString() : null}::TIMESTAMPTZ, ${t.verifiedAt ? t.verifiedAt.toISOString() : null}::TIMESTAMPTZ, ${t.verifiedById || null}, ${t.qualityScore || null}, ${t.createdAt.toISOString()}::TIMESTAMPTZ, ${now.toISOString()}::TIMESTAMPTZ, ${managerId})`);
}
console.log('🧹 12个保洁任务插入完成');

const missedTaskId = tasks[6].id;
const lateTaskId = tasks[1].id;
const complaintTaskId = tasks[0].id;

const complaints = [
  { id: generateIdFromEntropySize(16), propertyId: prop1, bookingId: booking7, taskId: complaintTaskId, title: '浴室水龙头有污渍', content: '客人退房时反馈浴室水龙头周围有明显水渍和污渍，洗手台角落有头发残留。客人表示下一次不会再选择入住。', severity: 'medium' as const, source: 'platform_review' as const, tags: ['卫生间', '污渍', '头发'], reviewRating: 3, reviewPlatform: 'Airbnb', responsibleCleanerId: cleaner1Id, handlerId: managerId, status: 'resolved' as const, resolution: '已重新派单清洁，并向客人发送道歉信和下次入住8折优惠券。', compensation: 200, filedAt: daysFromNow(-4), resolvedAt: daysFromNow(-3) },
  { id: generateIdFromEntropySize(16), propertyId: prop3, bookingId: booking3, taskId: lateTaskId, title: '保洁超时导致延迟入住', content: '客人下午2点到达无法入住，保洁直到下午3点才完成。客人非常不满，已在美团给出2星差评。', severity: 'high' as const, source: 'guest' as const, tags: ['超时', '延迟入住', '差评'], reviewRating: 2, reviewPlatform: '美团民宿', responsibleCleanerId: cleaner2Id, handlerId: managerId, status: 'investigating' as const, filedAt: daysFromNow(-1) },
  { id: generateIdFromEntropySize(16), propertyId: prop2, taskId: missedTaskId, title: '保洁漏单导致房间未清洁', content: '新客人入住时发现房间未做保洁，床铺未整理，垃圾未清理。客人当即要求取消订单并全额退款。', severity: 'critical' as const, source: 'guest' as const, tags: ['漏单', '退款', '严重客诉'], reviewRating: 1, reviewPlatform: '途家', responsibleCleanerId: cleaner3Id, handlerId: managerId, status: 'open' as const, filedAt: daysFromNow(-3) },
  { id: generateIdFromEntropySize(16), propertyId: prop5, title: '空调制冷效果差', content: '业主反馈巡检时发现主卧空调出风不凉，可能需要加氟或检修。', severity: 'low' as const, source: 'inspection' as const, tags: ['设施', '空调', '维修'], status: 'open' as const, filedAt: daysFromNow(-1) }
];
for (const c of complaints) {
  const tagsSql = c.tags ? sql`ARRAY[${sql.join(c.tags, sql.raw(','))}]::TEXT[]` : sql`NULL`;
  await db.execute(sql`INSERT INTO complaint (id, property_id, booking_id, task_id, title, content, severity, source, status, tags, evidence_urls, review_rating, review_platform, review_link, responsible_cleaner_id, handler_id, resolution, compensation, filed_at, resolved_at, closed_at, created_at, updated_at) VALUES (${c.id}, ${c.propertyId}, ${c.bookingId || null}, ${c.taskId || null}, ${c.title}, ${c.content}, ${c.severity}::complaint_severity, ${c.source}::complaint_source, ${c.status}::complaint_status, ${tagsSql}, NULL, ${c.reviewRating || null}, ${c.reviewPlatform || null}, NULL, ${c.responsibleCleanerId || null}, ${c.handlerId || null}, ${c.resolution || null}, ${c.compensation || null}, ${c.filedAt.toISOString()}::TIMESTAMPTZ, ${c.resolvedAt ? c.resolvedAt.toISOString() : null}::TIMESTAMPTZ, NULL, ${c.filedAt.toISOString()}::TIMESTAMPTZ, ${now.toISOString()}::TIMESTAMPTZ)`);
}
console.log('💬 4条客诉数据插入完成');

const anomalies = [
  { id: generateIdFromEntropySize(16), taskId: missedTaskId, propertyId: prop2, type: 'missed_cleaning' as const, title: '保洁漏单', description: '滨江豪华三居室退房保洁未完成，保洁员未到岗。', impactScope: '导致后续客人无法入住，产生退单、客诉和平台差评。直接影响房源信誉评分，可能被平台降权。', impactedBookings: null, impactLevel: 'critical' as const, responsiblePersonId: cleaner3Id, responsibleRole: '保洁员', discoveredAt: new Date(daysFromNow(-4).getTime() + 16 * 3600000), discoveredById: managerId, status: 'handling' as const, handlingMeasures: '1. 紧急安排备用保洁员补做清洁；2. 联系客人安排附近酒店过渡；3. 启动客诉处理流程。', handlingResult: '清洁已于当日18:00前完成，客人已安排至附近同等级酒店入住，差价由我方承担。', handlingConclusion: null, handledById: null, handledAt: null, closedAt: null, penalty: '扣除保洁员当月奖金50%', compensation: 1500, followUpRequired: true, followUpNotes: '需3天后回访客人满意度，并跟进平台差评申诉进度', createdAt: daysFromNow(-3) },
  { id: generateIdFromEntropySize(16), taskId: lateTaskId, propertyId: prop3, type: 'late_cleaning' as const, title: '保洁超时1小时', description: '灵隐别墅退房保洁超时完成，截止时间12:00，实际完成13:00。', impactScope: '客人延迟入住1小时，产生不满情绪，已给出平台差评。', impactedBookings: [booking3], impactLevel: 'high' as const, responsiblePersonId: cleaner2Id, responsibleRole: '保洁员', discoveredAt: new Date(daysFromNow(-2).getTime() + 12 * 3600000), discoveredById: managerId, status: 'resolved' as const, handlingMeasures: '1. 向客人致歉并解释情况；2. 免费升级下一单服务；3. 与保洁员沟通优化排期。', handlingResult: '客人接受道歉，已发放下次入住5折优惠券。', handlingConclusion: '系保洁员前一单超时导致连锁延误，已优化排班缓冲时间，相邻订单间预留30分钟。', handledById: managerId, handledAt: daysFromNow(-1), closedAt: null, penalty: '口头警告', compensation: 300, followUpRequired: false, followUpNotes: null, createdAt: daysFromNow(-2) },
  { id: generateIdFromEntropySize(16), taskId: complaintTaskId, propertyId: prop1, type: 'quality_issue' as const, title: '保洁质量问题', description: '验收时发现浴室水龙头周围有水渍、洗手台有头发残留，清洁不彻底。', impactScope: '收到客人平台3星评价，提及卫生细节问题。', impactedBookings: [booking7], impactLevel: 'medium' as const, responsiblePersonId: cleaner1Id, responsibleRole: '保洁员', discoveredAt: new Date(daysFromNow(-5).getTime() + 13 * 3600000), discoveredById: managerId, status: 'closed' as const, handlingMeasures: '1. 安排重新清洁问题区域；2. 向保洁员强调检查清单重要性；3. 增加卫生间专项培训。', handlingResult: '问题区域当日复洁合格，保洁员完成专项培训考核。', handlingConclusion: '此为保洁员检查疏漏，已要求清洁完成后严格按照检查清单逐项确认，后续质量评分与奖金挂钩。', handledById: managerId, handledAt: daysFromNow(-4), closedAt: daysFromNow(-3), penalty: '扣质量分5分', compensation: 200, followUpRequired: false, followUpNotes: null, createdAt: daysFromNow(-5) }
];
for (const a of anomalies) {
  const impactedBookingsSql = a.impactedBookings ? sql`ARRAY[${sql.join(a.impactedBookings, sql.raw(','))}]::TEXT[]` : sql`NULL`;
  await db.execute(sql`INSERT INTO anomaly (id, task_id, property_id, type, title, description, impact_scope, impacted_bookings, impact_level, responsible_person_id, responsible_role, discovered_at, discovered_by_id, status, handling_measures, handling_result, handling_conclusion, handled_by_id, handled_at, closed_at, penalty, compensation, follow_up_required, follow_up_notes, created_at, updated_at) VALUES (${a.id}, ${a.taskId}, ${a.propertyId}, ${a.type}::anomaly_type, ${a.title}, ${a.description}, ${a.impactScope}, ${impactedBookingsSql}, ${a.impactLevel}::anomaly_impact_level, ${a.responsiblePersonId}, ${a.responsibleRole}, ${a.discoveredAt.toISOString()}::TIMESTAMPTZ, ${a.discoveredById}, ${a.status}::anomaly_status, ${a.handlingMeasures}, ${a.handlingResult}, ${a.handlingConclusion}, ${a.handledById || null}, ${a.handledAt ? a.handledAt.toISOString() : null}::TIMESTAMPTZ, ${a.closedAt ? a.closedAt.toISOString() : null}::TIMESTAMPTZ, ${a.penalty}, ${a.compensation}, ${a.followUpRequired}, ${a.followUpNotes}, ${a.createdAt.toISOString()}::TIMESTAMPTZ, ${now.toISOString()}::TIMESTAMPTZ)`);
}
console.log('⚠️ 3个异常单插入完成');

console.log('\n✅✅✅ 数据库完全重建完成！');
console.log('\n默认账号（密码均为 123456）：');
console.log('  admin    - 系统管理员');
console.log('  manager  - 王经理（运营经理）');
console.log('  cleaner1 - 张阿姨（保洁员）');
console.log('  cleaner2 - 李阿姨（保洁员）');
console.log('  cleaner3 - 赵师傅（保洁员）');
console.log('  viewer   - 查看者（只读权限）');

await client.end();
