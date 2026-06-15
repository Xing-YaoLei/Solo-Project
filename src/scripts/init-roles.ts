import 'dotenv/config';
import { db } from '../server/db';
import { roles } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';

type UserRoleCode = 'student' | 'assistant' | 'lecturer' | 'admin';

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
			console.log(`角色已存在: ${role.name} (${role.code})`);
		} else {
			await db.insert(roles).values({
				id: generateId(15),
				code: role.code,
				name: role.name,
				description: role.description
			});
			console.log(`创建角色: ${role.name} (${role.code})`);
		}
	}

	console.log('角色初始化完成！');
	process.exit(0);
}

initRoles().catch((err) => {
	console.error('初始化失败:', err);
	process.exit(1);
});
