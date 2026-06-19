import { db } from './src/lib/server/db';
import { userTable, propertyTable, bookingTable, cleaningTaskTable, complaintTable, anomalyTable, guestDocumentTable, calendarEventTable } from './src/lib/server/db/schema';
import { generateIdFromEntropySize } from 'lucia';
import { Argon2id } from 'oslo/password';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function daysFromNow(n: number): number {
	return now + n * day;
}

async function seed() {
	console.log('开始初始化种子数据...');

	const users = [
		{ id: generateIdFromEntropySize(16), username: 'admin', realName: '系统管理员', email: 'admin@minsu.com', phone: '13800000001', role: 'admin' as const },
		{ id: generateIdFromEntropySize(16), username: 'manager', realName: '王经理', email: 'manager@minsu.com', phone: '13800000002', role: 'manager' as const },
		{ id: generateIdFromEntropySize(16), username: 'cleaner1', realName: '张阿姨', email: null, phone: '13800000003', role: 'cleaner' as const },
		{ id: generateIdFromEntropySize(16), username: 'cleaner2', realName: '李阿姨', email: null, phone: '13800000004', role: 'cleaner' as const },
		{ id: generateIdFromEntropySize(16), username: 'cleaner3', realName: '赵师傅', email: null, phone: '13800000005', role: 'cleaner' as const },
		{ id: generateIdFromEntropySize(16), username: 'viewer', realName: '查看者', email: 'viewer@minsu.com', phone: null, role: 'viewer' as const }
	];

	const hashedPassword = await new Argon2id().hash('123456');

	await db.insert(userTable).values(
		users.map((u) => ({
			...u,
			createdAt: new Date(now),
			updatedAt: new Date(now)
		}))
	).run();

	console.log('用户数据已插入，默认密码均为: 123456');

	const adminId = users[0].id;
	const managerId = users[1].id;
	const cleaner1Id = users[2].id;
	const cleaner2Id = users[3].id;
	const cleaner3Id = users[4].id;

	const properties = [
		{ id: generateIdFromEntropySize(16), name: '西湖畔·观景公寓', address: '杭州市西湖区文三路100号', type: 'apartment' as const, bedrooms: 2, bathrooms: 1, area: 85, phone: '0571-88888888', ownerName: '陈业主', ownerPhone: '13900000001' },
		{ id: generateIdFromEntropySize(16), name: '滨江·豪华三居室', address: '杭州市滨江区江南大道500号', type: 'apartment' as const, bedrooms: 3, bathrooms: 2, area: 120, phone: '0571-88888889', ownerName: '林业主', ownerPhone: '13900000002' },
		{ id: generateIdFromEntropySize(16), name: '灵隐·私家别墅', address: '杭州市西湖区灵隐路88号', type: 'villa' as const, bedrooms: 4, bathrooms: 3, area: 280, phone: '0571-88888890', ownerName: '周业主', ownerPhone: '13900000003' },
		{ id: generateIdFromEntropySize(16), name: '武林·温馨两居', address: '杭州市下城区武林广场10号', type: 'apartment' as const, bedrooms: 2, bathrooms: 1, area: 75, phone: '0571-88888891', ownerName: '吴业主', ownerPhone: '13900000004' },
		{ id: generateIdFromEntropySize(16), name: '钱江新城·江景房', address: '杭州市上城区钱江路200号', type: 'house' as const, bedrooms: 3, bathrooms: 2, area: 140, phone: '0571-88888892', ownerName: '郑业主', ownerPhone: '13900000005' },
		{ id: generateIdFromEntropySize(16), name: '黄龙·商务套房', address: '杭州市西湖区黄龙路100号', type: 'room' as const, bedrooms: 1, bathrooms: 1, area: 45, phone: '0571-88888893', ownerName: '孙业主', ownerPhone: '13900000006' }
	];

	await db.insert(propertyTable).values(
		properties.map((p) => ({
			...p,
			status: 'active' as const,
			createdAt: now,
			updatedAt: now,
			createdById: adminId
		}))
	).run();

	console.log('房源数据已插入');

	const prop1 = properties[0].id;
	const prop2 = properties[1].id;
	const prop3 = properties[2].id;
	const prop4 = properties[3].id;
	const prop5 = properties[4].id;
	const prop6 = properties[5].id;

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

	await db.insert(bookingTable).values(
		bookings.map((b) => ({
			...b,
			createdAt: now,
			updatedAt: now
		}))
	).run();

	console.log('预订数据已插入');

	const booking3 = bookings[2].id;
	const booking1 = bookings[0].id;
	const booking7 = bookings[6].id;

	const documents = [
		{ id: generateIdFromEntropySize(16), bookingId: booking3, guestName: '张伟', idType: 'id_card' as const, idNumber: '330100199001011234' },
		{ id: generateIdFromEntropySize(16), bookingId: booking3, guestName: '李娜', idType: 'id_card' as const, idNumber: '330100199202024321' },
		{ id: generateIdFromEntropySize(16), bookingId: booking1, guestName: '刘强', idType: 'id_card' as const, idNumber: '110100198808085678', verifiedAt: now - day, verifiedById: managerId },
		{ id: generateIdFromEntropySize(16), bookingId: booking7, guestName: '周杰', idType: 'passport' as const, idNumber: 'E12345678', verifiedAt: now - 7 * day, verifiedById: managerId }
	];

	await db.insert(guestDocumentTable).values(
		documents.map((d, i) => ({
			...d,
			createdAt: now - (i + 1) * day
		}))
	).run();

	console.log('入住证件数据已插入');

	const tasks = [
		{ id: generateIdFromEntropySize(16), propertyId: prop1, bookingId: booking7, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(-5), type: 'checkout_cleaning' as const, priority: 'high' as const, status: 'verified' as const, actualStartTime: daysFromNow(-5) + 9 * 3600000, actualEndTime: daysFromNow(-5) + 12 * 3600000, deadlineTime: daysFromNow(-5) + 14 * 3600000, verifiedAt: daysFromNow(-5) + 13 * 3600000, verifiedById: managerId, qualityScore: 95, createdAt: daysFromNow(-6) },
		{ id: generateIdFromEntropySize(16), propertyId: prop3, bookingId: booking3, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(-2), type: 'checkout_cleaning' as const, priority: 'urgent' as const, status: 'completed' as const, actualStartTime: daysFromNow(-2) + 8 * 3600000, actualEndTime: daysFromNow(-2) + 13 * 3600000, deadlineTime: daysFromNow(-2) + 12 * 3600000, createdAt: daysFromNow(-3) },
		{ id: generateIdFromEntropySize(16), propertyId: prop1, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(1), type: 'checkout_cleaning' as const, priority: 'high' as const, status: 'assigned' as const, deadlineTime: daysFromNow(1) + 14 * 3600000, createdAt: daysFromNow(-1) },
		{ id: generateIdFromEntropySize(16), propertyId: prop2, bookingId: bookings[1].id, assignedCleanerId: cleaner3Id, scheduledDate: daysFromNow(2), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'assigned' as const, deadlineTime: daysFromNow(2) + 14 * 3600000, createdAt: daysFromNow(0) },
		{ id: generateIdFromEntropySize(16), propertyId: prop4, bookingId: bookings[3].id, scheduledDate: daysFromNow(3), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'pending' as const, deadlineTime: daysFromNow(3) + 14 * 3600000, createdAt: daysFromNow(0) },
		{ id: generateIdFromEntropySize(16), propertyId: prop5, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(0), type: 'periodic_cleaning' as const, priority: 'low' as const, status: 'in_progress' as const, actualStartTime: now - 3600000, createdAt: daysFromNow(-1) },
		{ id: generateIdFromEntropySize(16), propertyId: prop2, assignedCleanerId: cleaner3Id, scheduledDate: daysFromNow(-4), type: 'checkout_cleaning' as const, priority: 'high' as const, status: 'missed' as const, deadlineTime: daysFromNow(-4) + 14 * 3600000, createdAt: daysFromNow(-5) },
		{ id: generateIdFromEntropySize(16), propertyId: prop6, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(5), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'pending' as const, deadlineTime: daysFromNow(5) + 14 * 3600000, createdAt: daysFromNow(0) },
		{ id: generateIdFromEntropySize(16), propertyId: prop3, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(7), type: 'deep_cleaning' as const, priority: 'high' as const, status: 'assigned' as const, deadlineTime: daysFromNow(7) + 18 * 3600000, createdAt: daysFromNow(-1) },
		{ id: generateIdFromEntropySize(16), propertyId: prop5, bookingId: bookings[4].id, assignedCleanerId: cleaner1Id, scheduledDate: daysFromNow(3), type: 'checkout_cleaning' as const, priority: 'urgent' as const, status: 'assigned' as const, deadlineTime: daysFromNow(3) + 12 * 3600000, createdAt: daysFromNow(0) },
		{ id: generateIdFromEntropySize(16), propertyId: prop4, assignedCleanerId: cleaner3Id, scheduledDate: daysFromNow(-1), type: 'checkout_cleaning' as const, priority: 'medium' as const, status: 'accepted' as const, deadlineTime: daysFromNow(-1) + 14 * 3600000, createdAt: daysFromNow(-2) },
		{ id: generateIdFromEntropySize(16), propertyId: prop6, assignedCleanerId: cleaner2Id, scheduledDate: daysFromNow(-6), type: 'maintenance' as const, priority: 'low' as const, status: 'verified' as const, actualStartTime: daysFromNow(-6) + 10 * 3600000, actualEndTime: daysFromNow(-6) + 11 * 3600000, deadlineTime: daysFromNow(-6) + 16 * 3600000, verifiedAt: daysFromNow(-6) + 12 * 3600000, verifiedById: managerId, qualityScore: 88, createdAt: daysFromNow(-7) }
	];

	await db.insert(cleaningTaskTable).values(
		tasks.map((t, i) => ({
			...t,
			description: t.type === 'deep_cleaning' ? '季度深度清洁，包括油烟机、空调清洗' : t.type === 'maintenance' ? '例行设施检查保养' : '退房后标准清洁',
			checklist: ['卫生间消毒', '床单更换', '地面清洁', '垃圾清理', '厨房擦拭'],
			createdAt: t.createdAt,
			updatedAt: now,
			createdById: managerId
		}))
	).run();

	console.log('保洁任务数据已插入');

	const missedTaskId = tasks[6].id;
	const lateTaskId = tasks[1].id;
	const complaintTaskId = tasks[0].id;

	const complaints = [
		{
			id: generateIdFromEntropySize(16),
			propertyId: prop1,
			bookingId: booking7,
			taskId: complaintTaskId,
			title: '浴室水龙头有污渍',
			content: '客人退房时反馈浴室水龙头周围有明显水渍和污渍，洗手台角落有头发残留。客人表示下一次不会再选择入住。',
			severity: 'medium' as const,
			source: 'platform_review' as const,
			tags: ['卫生间', '污渍', '头发'],
			reviewRating: 3,
			reviewPlatform: 'Airbnb',
			responsibleCleanerId: cleaner1Id,
			handlerId: managerId,
			status: 'resolved' as const,
			resolution: '已重新派单清洁，并向客人发送道歉信和下次入住8折优惠券。',
			compensation: 200,
			filedAt: daysFromNow(-4),
			resolvedAt: daysFromNow(-3)
		},
		{
			id: generateIdFromEntropySize(16),
			propertyId: prop3,
			bookingId: booking3,
			taskId: lateTaskId,
			title: '保洁超时导致延迟入住',
			content: '客人下午2点到达无法入住，保洁直到下午3点才完成。客人非常不满，已在美团给出2星差评。',
			severity: 'high' as const,
			source: 'guest' as const,
			tags: ['超时', '延迟入住', '差评'],
			reviewRating: 2,
			reviewPlatform: '美团民宿',
			responsibleCleanerId: cleaner2Id,
			handlerId: managerId,
			status: 'investigating' as const,
			filedAt: daysFromNow(-1)
		},
		{
			id: generateIdFromEntropySize(16),
			propertyId: prop2,
			taskId: missedTaskId,
			title: '保洁漏单导致房间未清洁',
			content: '新客人入住时发现房间未做保洁，床铺未整理，垃圾未清理。客人当即要求取消订单并全额退款。',
			severity: 'critical' as const,
			source: 'guest' as const,
			tags: ['漏单', '退款', '严重客诉'],
			reviewRating: 1,
			reviewPlatform: '途家',
			responsibleCleanerId: cleaner3Id,
			handlerId: managerId,
			status: 'open' as const,
			filedAt: daysFromNow(-3)
		},
		{
			id: generateIdFromEntropySize(16),
			propertyId: prop5,
			title: '空调制冷效果差',
			content: '业主反馈巡检时发现主卧空调出风不凉，可能需要加氟或检修。',
			severity: 'low' as const,
			source: 'inspection' as const,
			tags: ['设施', '空调', '维修'],
			status: 'open' as const,
			filedAt: daysFromNow(-1)
		}
	];

	await db.insert(complaintTable).values(
		complaints.map((c) => ({
			...c,
			createdAt: c.filedAt,
			updatedAt: now
		}))
	).run();

	console.log('客诉数据已插入');

	const anomalies = [
		{
			id: generateIdFromEntropySize(16),
			taskId: missedTaskId,
			propertyId: prop2,
			type: 'missed_cleaning' as const,
			title: '保洁漏单',
			description: `滨江豪华三居室退房保洁未完成，计划日期${new Date(daysFromNow(-4)).toLocaleDateString()}，保洁员未到岗。`,
			impactScope: '导致后续客人无法入住，产生退单、客诉和平台差评。直接影响房源信誉评分，可能被平台降权。',
			impactedBookings: [],
			impactLevel: 'critical' as const,
			responsiblePersonId: cleaner3Id,
			responsibleRole: '保洁员',
			discoveredAt: daysFromNow(-4) + 16 * 3600000,
			discoveredById: managerId,
			status: 'handling' as const,
			handlingMeasures: '1. 紧急安排备用保洁员补做清洁；2. 联系客人安排附近酒店过渡；3. 启动客诉处理流程。',
			handlingResult: '清洁已于当日18:00前完成，客人已安排至附近同等级酒店入住，差价由我方承担。',
			penalty: '扣除保洁员当月奖金50%',
			compensation: 1500,
			followUpRequired: true,
			followUpNotes: '需3天后回访客人满意度，并跟进平台差评申诉进度',
			createdAt: daysFromNow(-3)
		},
		{
			id: generateIdFromEntropySize(16),
			taskId: lateTaskId,
			propertyId: prop3,
			type: 'late_cleaning' as const,
			title: '保洁超时1小时',
			description: `灵隐别墅退房保洁超时完成，截止时间12:00，实际完成13:00，延迟1小时。`,
			impactScope: '客人延迟入住1小时，产生不满情绪，已给出平台差评。',
			impactedBookings: [booking3],
			impactLevel: 'high' as const,
			responsiblePersonId: cleaner2Id,
			responsibleRole: '保洁员',
			discoveredAt: daysFromNow(-2) + 12 * 3600000,
			discoveredById: managerId,
			status: 'resolved' as const,
			handlingMeasures: '1. 向客人致歉并解释情况；2. 免费升级下一单服务；3. 与保洁员沟通优化排期。',
			handlingResult: '客人接受道歉，已发放下次入住5折优惠券。',
			handlingConclusion: '系保洁员前一单超时导致连锁延误，已优化排班缓冲时间，相邻订单间预留30分钟。',
			handledById: managerId,
			handledAt: daysFromNow(-1),
			penalty: '口头警告',
			compensation: 300,
			followUpRequired: false,
			createdAt: daysFromNow(-2)
		},
		{
			id: generateIdFromEntropySize(16),
			taskId: complaintTaskId,
			propertyId: prop1,
			type: 'quality_issue' as const,
			title: '保洁质量问题',
			description: '验收时发现浴室水龙头周围有水渍、洗手台有头发残留，清洁不彻底。',
			impactScope: '收到客人平台3星评价，提及卫生细节问题。',
			impactedBookings: [booking7],
			impactLevel: 'medium' as const,
			responsiblePersonId: cleaner1Id,
			responsibleRole: '保洁员',
			discoveredAt: daysFromNow(-5) + 13 * 3600000,
			discoveredById: managerId,
			status: 'closed' as const,
			handlingMeasures: '1. 安排重新清洁问题区域；2. 向保洁员强调检查清单重要性；3. 增加卫生间专项培训。',
			handlingResult: '问题区域当日复洁合格，保洁员完成专项培训考核。',
			handlingConclusion: '此为保洁员检查疏漏，已要求清洁完成后严格按照检查清单逐项确认，后续质量评分与奖金挂钩。',
			handledById: managerId,
			handledAt: daysFromNow(-4),
			closedAt: daysFromNow(-3),
			penalty: '扣质量分5分',
			compensation: 200,
			followUpRequired: false,
			createdAt: daysFromNow(-5)
		}
	];

	await db.insert(anomalyTable).values(
		anomalies.map((a) => ({
			...a,
			updatedAt: now
		}))
	).run();

	console.log('异常单数据已插入');

	console.log('\n✅ 种子数据初始化完成！');
	console.log('\n默认账号（密码均为 123456）：');
	console.log('  admin    - 系统管理员');
	console.log('  manager  - 王经理（运营经理）');
	console.log('  cleaner1 - 张阿姨（保洁员）');
	console.log('  cleaner2 - 李阿姨（保洁员）');
	console.log('  cleaner3 - 赵师傅（保洁员）');
	console.log('  viewer   - 查看者（只读权限）');
}

seed().catch((e) => {
	console.error('种子数据初始化失败:', e);
	process.exit(1);
});
