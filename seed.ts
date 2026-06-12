import { db } from './src/lib/server/db';
import {
	userTable,
	timeoutDictionaryTable,
	escalationRuleTable,
	followupThresholdTable,
	issueTagTable,
	responsibilityDictTable,
	refundOrderTable,
	refundLogTable
} from './src/lib/server/db/schema';
import { Argon2id } from 'oslo/password';
import { generateId } from 'lucia';

async function seed() {
	console.log('🌱 开始初始化数据库...');

	console.log('👤 创建管理员用户...');
	const adminId = generateId(15);
	const operatorId1 = generateId(15);
	const operatorId2 = generateId(15);
	const passwordHash = await new Argon2id().hash('admin123');

	await db.insert(userTable).values([
		{
			id: adminId,
			username: 'admin',
			passwordHash,
			role: 'admin',
			realName: '系统管理员',
			region: '华东区'
		},
		{
			id: operatorId1,
			username: 'operator1',
			passwordHash,
			role: 'operator',
			realName: '张运营',
			region: '华东区'
		},
		{
			id: operatorId2,
			username: 'operator2',
			passwordHash,
			role: 'operator',
			realName: '李运营',
			region: '华南区'
		}
	]);
	console.log('✅ 用户创建完成');

	console.log('⏱️  插入处理时限字典...');
	await db.insert(timeoutDictionaryTable).values([
		{ statusKey: 'pending', statusName: '待处理', timeoutHours: 2, description: '售后单创建后需在2小时内开始处理' },
		{ statusKey: 'processing', statusName: '处理中', timeoutHours: 24, description: '处理中状态需在24小时内完成或升级' },
		{ statusKey: 'escalated', statusName: '已升级', timeoutHours: 48, description: '升级后需在48小时内处理完成' }
	]);
	console.log('✅ 处理时限字典创建完成');

	console.log('⬆️  插入升级规则...');
	await db.insert(escalationRuleTable).values([
		{
			name: '超时一级升级',
			triggerCondition: '处理超时2小时',
			escalateToRole: 'leader',
			level: 1
		},
		{
			name: '超时二级升级',
			triggerCondition: '处理超时24小时',
			escalateToRole: 'admin',
			level: 2
		},
		{
			name: '重大投诉升级',
			triggerCondition: '客户明确投诉',
			escalateToRole: 'admin',
			level: 1
		}
	]);
	console.log('✅ 升级规则创建完成');

	console.log('📊 插入回访阈值...');
	await db.insert(followupThresholdTable).values([
		{ resultKey: 'satisfied', resultName: '满意', requiresReview: false },
		{ resultKey: 'basically_satisfied', resultName: '基本满意', requiresReview: false },
		{ resultKey: 'dissatisfied', resultName: '不满意', requiresReview: true, warningThreshold: 3 },
		{ resultKey: 'no_answer', resultName: '无人接听', requiresReview: false },
		{ resultKey: 'refund_completed', resultName: '已退款', requiresReview: false }
	]);
	console.log('✅ 回访阈值创建完成');

	console.log('🏷️  插入问题标签...');
	await db.insert(issueTagTable).values([
		{ name: '商品质量', category: '商品问题', color: '#ef4444', sortOrder: 1 },
		{ name: '商品破损', category: '商品问题', color: '#f59e0b', sortOrder: 2 },
		{ name: '发错货', category: '配送问题', color: '#3b82f6', sortOrder: 3 },
		{ name: '漏发货', category: '配送问题', color: '#8b5cf6', sortOrder: 4 },
		{ name: '配送延迟', category: '配送问题', color: '#06b6d4', sortOrder: 5 },
		{ name: '价格争议', category: '售后问题', color: '#10b981', sortOrder: 6 },
		{ name: '描述不符', category: '商品问题', color: '#ec4899', sortOrder: 7 },
		{ name: '客户原因', category: '客户问题', color: '#6b7280', sortOrder: 8 }
	]);
	console.log('✅ 问题标签创建完成');

	console.log('👥 插入责任归属...');
	await db.insert(responsibilityDictTable).values([
		{ key: 'supplier', name: '供应商责任', department: '供应链部', sortOrder: 1 },
		{ key: 'logistics', name: '物流责任', department: '物流部', sortOrder: 2 },
		{ key: 'platform', name: '平台责任', department: '运营部', sortOrder: 3 },
		{ key: 'customer', name: '客户责任', department: '客服部', sortOrder: 4 },
		{ key: 'shared', name: '双方有责', department: '运营部', sortOrder: 5 },
		{ key: 'to_be_confirmed', name: '待认定', department: '运营部', sortOrder: 6 }
	]);
	console.log('✅ 责任归属字典创建完成');

	console.log('📦 创建演示售后单...');
	const now = new Date();
	const demoOrders = [
		{
			orderNo: 'RT202606130001',
			communityName: '阳光花园小区',
			region: '华东区',
			customerName: '王女士',
			customerPhone: '13800138001',
			productName: '有机蔬菜套餐',
			refundAmount: 5900,
			refundReason: '蔬菜不新鲜，有部分腐烂',
			status: 'pending',
			currentHandlerId: adminId,
			currentHandlerName: '系统管理员',
			createdAt: new Date(now.getTime() - 30 * 60 * 1000)
		},
		{
			orderNo: 'RT202606130002',
			communityName: '翠苑小区',
			region: '华东区',
			customerName: '李先生',
			customerPhone: '13800138002',
			productName: '进口牛排',
			refundAmount: 12800,
			refundReason: '牛排解冻后有异味，怀疑变质',
			status: 'processing',
			responsibility: '供应商责任',
			issueTag: '商品质量',
			currentHandlerId: operatorId1,
			currentHandlerName: '张运营',
			createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
		},
		{
			orderNo: 'RT202606120003',
			communityName: '锦绣花园',
			region: '华南区',
			customerName: '陈女士',
			customerPhone: '13900139003',
			productName: '水果礼盒',
			refundAmount: 8800,
			refundReason: '送错地址，晚了一天才收到',
			status: 'escalated',
			responsibility: '物流责任',
			issueTag: '配送延迟',
			currentHandlerId: adminId,
			currentHandlerName: '系统管理员',
			createdAt: new Date(now.getTime() - 28 * 60 * 60 * 1000)
		},
		{
			orderNo: 'RT202606100004',
			communityName: '阳光花园小区',
			region: '华东区',
			customerName: '赵先生',
			customerPhone: '13700137004',
			productName: '牛奶订户月卡',
			refundAmount: 15000,
			refundReason: '客户搬家，要求退剩余部分',
			status: 'closed',
			responsibility: '客户责任',
			issueTag: '客户原因',
			followupResult: '已退款',
			currentHandlerId: operatorId1,
			currentHandlerName: '张运营',
			createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
			closedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
		},
		{
			orderNo: 'RT202606110005',
			communityName: '绿城小区',
			region: '华北区',
			customerName: '孙女士',
			customerPhone: '13600136005',
			productName: '海鲜大礼包',
			refundAmount: 29900,
			refundReason: '收到时冰袋已化，部分海鲜变质',
			status: 'closed',
			responsibility: '物流责任',
			issueTag: '商品破损',
			followupResult: '满意',
			currentHandlerId: operatorId2,
			currentHandlerName: '李运营',
			createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
			closedAt: new Date(now.getTime() - 20 * 60 * 60 * 1000)
		}
	];

	for (const order of demoOrders) {
		const result = await db.insert(refundOrderTable).values(order as any).returning();
		const orderId = result[0].id;

		await db.insert(refundLogTable).values({
			refundOrderId: orderId,
			actionType: 'create',
			actionDetail: '创建售后单',
			newStatus: 'pending',
			operatorId: adminId,
			operatorName: '系统管理员',
			createdAt: order.createdAt
		});

		if (order.status !== 'pending') {
			await db.insert(refundLogTable).values({
				refundOrderId: orderId,
				actionType: 'assign_responsibility',
				actionDetail: `责任归属: ${order.responsibility}, 问题标签: ${order.issueTag}`,
				oldStatus: 'pending',
				newStatus: 'processing',
				operatorId: order.currentHandlerId,
				operatorName: order.currentHandlerName,
				createdAt: new Date((order.createdAt as Date).getTime() + 30 * 60 * 1000)
			});
		}

		if (order.status === 'escalated') {
			await db.insert(refundLogTable).values({
				refundOrderId: orderId,
				actionType: 'escalate',
				actionDetail: '升级处理 (第1级): 处理超时，升级至: 系统管理员',
				oldStatus: 'processing',
				newStatus: 'escalated',
				operatorId: operatorId1,
				operatorName: '张运营',
				createdAt: new Date((order.createdAt as Date).getTime() + 26 * 60 * 60 * 1000)
			});
		}

		if (order.status === 'closed') {
			await db.insert(refundLogTable).values({
				refundOrderId: orderId,
				actionType: 'followup',
				actionDetail: `回访结果: ${order.followupResult}`,
				oldStatus: 'processing',
				newStatus: 'processing',
				operatorId: order.currentHandlerId,
				operatorName: order.currentHandlerName,
				createdAt: new Date((order.closedAt as Date).getTime() - 2 * 60 * 60 * 1000)
			});

			await db.insert(refundLogTable).values({
				refundOrderId: orderId,
				actionType: 'close',
				actionDetail: `关闭售后单，最终结果: ${order.followupResult}`,
				oldStatus: 'processing',
				newStatus: 'closed',
				operatorId: order.currentHandlerId,
				operatorName: order.currentHandlerName,
				createdAt: order.closedAt
			});
		}
	}
	console.log('✅ 演示数据创建完成');

	console.log('\n🎉 数据库初始化完成！');
	console.log('👤 管理员账号: admin / admin123');
	console.log('👤 运营账号: operator1 / admin123');
	console.log('👤 运营账号: operator2 / admin123');

	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ 初始化失败:', err);
	process.exit(1);
});
