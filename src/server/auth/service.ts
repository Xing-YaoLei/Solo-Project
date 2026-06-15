import { db } from '../db';
import { users, userRoles, roles } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { lucia, type AuthUser } from './lucia';
import { getPermissionsByRoles } from './permissions';
import type { UserRoleCode } from '../db/schema/roles';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';

export async function getUserWithRoles(userId: string): Promise<AuthUser | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId)
	});

	if (!user) return null;

	const userRoleRecords = await db.query.userRoles.findMany({
		where: eq(userRoles.userId, userId),
		with: {
			role: true
		}
	});

	const roleCodes = userRoleRecords.map((ur) => (ur.role as unknown as { code: UserRoleCode }).code);
	const permissions = getPermissionsByRoles(roleCodes);

	return {
		id: user.id,
		email: user.email,
		name: user.name,
		avatar: user.avatar,
		roles: roleCodes,
		permissions
	};
}

export async function validateSession(sessionId: string): Promise<AuthUser | null> {
	const { session, user } = await lucia.validateSession(sessionId);

	if (!session || !user) return null;

	return getUserWithRoles(user.id);
}

export async function login(
	email: string,
	password: string
): Promise<{ user: AuthUser; sessionId: string } | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.email, email)
	});

	if (!user || !user.passwordHash) return null;
	if (!user.isActive) return null;

	const validPassword = await new Argon2id().verify(user.passwordHash, password);
	if (!validPassword) return null;

	const session = await lucia.createSession(user.id, {});
	const authUser = await getUserWithRoles(user.id);

	if (!authUser) return null;

	return { user: authUser, sessionId: session.id };
}

export async function register(input: {
	email: string;
	password: string;
	name: string;
	role?: UserRoleCode;
}): Promise<AuthUser> {
	const existingUser = await db.query.users.findFirst({
		where: eq(users.email, input.email)
	});

	if (existingUser) {
		throw new Error('邮箱已存在');
	}

	const userId = generateId(15);
	const passwordHash = await new Argon2id().hash(input.password);

	await db.insert(users).values({
		id: userId,
		email: input.email,
		name: input.name,
		passwordHash
	});

	const roleCode = input.role || 'student';
	const role = await db.query.roles.findFirst({
		where: eq(roles.code, roleCode)
	});

	if (role) {
		await db.insert(userRoles).values({
			id: generateId(15),
			userId,
			roleId: role.id
		});
	}

	const authUser = await getUserWithRoles(userId);
	if (!authUser) {
		throw new Error('用户创建失败');
	}

	return authUser;
}

export async function logout(sessionId: string): Promise<void> {
	await lucia.invalidateSession(sessionId);
}

export async function initRoles(): Promise<void> {
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

		if (!existing) {
			await db.insert(roles).values({
				id: generateId(15),
				code: role.code,
				name: role.name,
				description: role.description
			});
		}
	}
}
