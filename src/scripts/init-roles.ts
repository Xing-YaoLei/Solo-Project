import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../server/db/schema';
import { roles } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';

type UserRoleCode = 'student' | 'assistant' | 'lecturer' | 'admin';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('错误: DATABASE_URL 环境变量未设置');
	console.error('请在 .env 文件中设置 DATABASE_URL，或通过环境变量传入');
	process.exit(1);
}

const client = postgres(DATABASE_URL);
const db = drizzle(client, { schema });

async function initRoles() {
	console.log('开始初始化角色...');

	const defaultRoles: { code: UserRoleCode; name: string; description: string }[] = [
		{ code: 'student', name: '学员', description: '普通学员，可学习课程和参加考试' },
		{ code: 'assistant', name: '助教', description: '协助讲师管理学员和批改作业' },
		{ code: 'lecturer', name: '讲师', description: '负责课程内容和教学管理' },
		{ code: 'admin', name: '教务', description: '系统管理员，拥有全部权限' }
	];

	for (const role of defaultRoles) {
		const existing = await db.query.roles.findFirst({
			where: eq(roles.code, role.code)
		});

		if (existing) {
			console.log(`  角色已存在: ${role.name} (${role.code})`);
		} else {
			await db.insert(roles).values({
				id: generateId(15),
				code: role.code,
				name: role.name,
				description: role.description
			});
			console.log(`  ✓ 创建角色: ${role.name} (${role.code})`);
		}
	}

	console.log('角色初始化完成！');
	await client.end();
	process.exit(0);
}

initRoles().catch(async (err) => {
	console.error('初始化失败:', err);
	await client.end();
	process.exit(1);
});
