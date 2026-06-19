import { z } from 'zod';
import { hash } from '@node-rs/argon2';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';

async function main() {
	console.log('开始初始化种子数据...');

	const passwordHash = await hash('Admin@123', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});

	const existing = await db.query.users.findFirst({
		where: eq(schema.users.username, 'admin')
	});

	if (existing) {
		console.log('管理员账号已存在，跳过创建');
	} else {
		await db.insert(schema.users).values({
			username: 'admin',
			passwordHash,
			name: '厂长',
			role: 'MANAGER'
		});
		console.log('创建管理员账号: admin / Admin@123');
	}

	const sampleUsers = [
		{ username: 'advisor01', name: '顾问小王', role: 'ADVISOR' as const },
		{ username: 'tech01', name: '技师老李', role: 'TECHNICIAN' as const },
		{ username: 'tech02', name: '技师小张', role: 'TECHNICIAN' as const },
		{ username: 'parts01', name: '配件员小陈', role: 'PARTS' as const }
	];

	for (const u of sampleUsers) {
		const exists = await db.query.users.findFirst({
			where: eq(schema.users.username, u.username)
		});
		if (!exists) {
			await db.insert(schema.users).values({
				username: u.username,
				passwordHash: await hash('123456', {
					memoryCost: 19456,
					timeCost: 2,
					outputLen: 32,
					parallelism: 1
				}),
				name: u.name,
				role: u.role
			});
			console.log(`创建用户: ${u.username} / 123456 (${u.name})`);
		}
	}

	const sampleParts = [
		{ sku: 'OIL-001', name: '全合成机油 5W-40', category: '机油', stock: 50, safety: 20, price: 280, unit: '桶' },
		{ sku: 'OIL-002', name: '半合成机油 10W-40', category: '机油', stock: 30, safety: 15, price: 180, unit: '桶' },
		{ sku: 'FLT-001', name: '机油滤清器', category: '滤清器', stock: 100, safety: 30, price: 35, unit: '个' },
		{ sku: 'FLT-002', name: '空气滤清器', category: '滤清器', stock: 5, safety: 20, price: 65, unit: '个' },
		{ sku: 'BRK-001', name: '前刹车片', category: '刹车', stock: 15, safety: 10, price: 320, unit: '副' },
		{ sku: 'BRK-002', name: '后刹车片', category: '刹车', stock: 12, safety: 10, price: 280, unit: '副' },
		{ sku: 'SPK-001', name: '火花塞 单铱金', category: '点火', stock: 3, safety: 16, price: 85, unit: '支' },
		{ sku: 'BAT-001', name: '蓄电池 60Ah', category: '电气', stock: 8, safety: 5, price: 580, unit: '个' }
	];

	for (const p of sampleParts) {
		const exists = await db.query.parts.findFirst({
			where: eq(schema.parts.sku, p.sku)
		});
		if (!exists) {
			await db.insert(schema.parts).values({
				sku: p.sku,
				name: p.name,
				category: p.category,
				stockQuantity: p.stock,
				safetyStock: p.safety,
				unitPrice: String(p.price),
				unit: p.unit
			});
			console.log(`创建配件: ${p.name}`);
		}
	}

	console.log('种子数据初始化完成！');
}

main().catch((e) => {
	console.error('种子数据初始化失败:', e);
	process.exit(1);
});
