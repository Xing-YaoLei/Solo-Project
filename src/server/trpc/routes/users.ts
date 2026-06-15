import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { users, userRoles, roles } from '../../db/schema';
import { eq, desc, and, like, or, sql } from 'drizzle-orm';
import { generateId } from 'lucia';
import { TRPCError } from '@trpc/server';
import { Argon2id } from 'oslo/password';

export const usersRouter = router({
	list: requirePermission('student.view')
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				role: z.string().optional(),
				keyword: z.string().optional(),
				isActive: z.boolean().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.role) {
				whereConditions.push(eq(roles.code, input.role));
			}
			if (input.keyword) {
				whereConditions.push(
					or(like(users.name, `%${input.keyword}%`), like(users.email, `%${input.keyword}%`))
				);
			}
			if (input.isActive !== undefined) {
				whereConditions.push(eq(users.isActive, input.isActive));
			}

			const query = ctx.db
				.select({
					id: users.id,
					email: users.email,
					name: users.name,
					avatar: users.avatar,
					phone: users.phone,
					isActive: users.isActive,
					createdAt: users.createdAt,
					roleCode: roles.code,
					roleName: roles.name
				})
				.from(users)
				.leftJoin(userRoles, eq(userRoles.userId, users.id))
				.leftJoin(roles, eq(roles.id, userRoles.roleId))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

			const items = await query
				.orderBy(desc(users.createdAt))
				.limit(input.pageSize)
				.offset((input.page - 1) * input.pageSize);

			const totalResult = await ctx.db
				.select({ count: sql<number>`count(distinct ${users.id})`.mapWith(Number) })
				.from(users)
				.leftJoin(userRoles, eq(userRoles.userId, users.id))
				.leftJoin(roles, eq(roles.id, userRoles.roleId))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

			return {
				items,
				total: totalResult[0]?.count || 0,
				page: input.page,
				pageSize: input.pageSize
			};
		}),

	get: protectedProcedure
		.input(z.object({ id: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const userId = input.id || ctx.user.id;

			const user = await ctx.db.query.users.findFirst({
				where: eq(users.id, userId),
				columns: {
					passwordHash: false
				}
			});

			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: '用户不存在' });
			}

			const userRoleRecords = await ctx.db.query.userRoles.findMany({
				where: eq(userRoles.userId, userId),
				with: {
					role: true
				}
			});

			return {
				...user,
				roles: userRoleRecords.map((ur) => ur.role)
			};
		}),

	create: requirePermission('user.manage')
		.input(
			z.object({
				email: z.string().email(),
				name: z.string().min(1).max(100),
				password: z.string().min(6),
				role: z.enum(['student', 'assistant', 'lecturer', 'admin']),
				phone: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const existingUser = await ctx.db.query.users.findFirst({
				where: eq(users.email, input.email)
			});

			if (existingUser) {
				throw new TRPCError({ code: 'BAD_REQUEST', message: '邮箱已存在' });
			}

			const userId = generateId(15);
			const passwordHash = await new Argon2id().hash(input.password);

			await ctx.db.insert(users).values({
				id: userId,
				email: input.email,
				name: input.name,
				passwordHash,
				phone: input.phone
			});

			const role = await ctx.db.query.roles.findFirst({
				where: eq(roles.code, input.role)
			});

			if (role) {
				await ctx.db.insert(userRoles).values({
					id: generateId(15),
					userId,
					roleId: role.id
				});
			}

			return { id: userId };
		}),

	update: requirePermission('user.manage')
		.input(
			z.object({
				id: z.string(),
				name: z.string().optional(),
				phone: z.string().optional(),
				isActive: z.boolean().optional(),
				role: z.enum(['student', 'assistant', 'lecturer', 'admin']).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, role, ...data } = input;

			if (Object.keys(data).length > 0) {
				await ctx.db
					.update(users)
					.set({
						...data,
						updatedAt: new Date()
					})
					.where(eq(users.id, id));
			}

			if (role) {
				const roleRecord = await ctx.db.query.roles.findFirst({
					where: eq(roles.code, role)
				});

				if (roleRecord) {
					await ctx.db.delete(userRoles).where(eq(userRoles.userId, id));
					await ctx.db.insert(userRoles).values({
						id: generateId(15),
						userId: id,
						roleId: roleRecord.id
					});
				}
			}

			return { success: true };
		}),

	listRoles: protectedProcedure.query(async ({ ctx }) => {
		const roleList = await ctx.db.query.roles.findMany({
			orderBy: roles.code
		});
		return roleList;
	}),

	export: requirePermission('export.data')
		.input(
			z.object({
				role: z.string().optional(),
				keyword: z.string().optional(),
				isActive: z.boolean().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.role) {
				whereConditions.push(eq(roles.code, input.role));
			}
			if (input.keyword) {
				whereConditions.push(
					or(like(users.name, `%${input.keyword}%`), like(users.email, `%${input.keyword}%`))
				);
			}
			if (input.isActive !== undefined) {
				whereConditions.push(eq(users.isActive, input.isActive));
			}

			const items = await ctx.db
				.select({
					email: users.email,
					name: users.name,
					phone: users.phone,
					isActive: users.isActive,
					createdAt: users.createdAt,
					roleName: roles.name
				})
				.from(users)
				.leftJoin(userRoles, eq(userRoles.userId, users.id))
				.leftJoin(roles, eq(roles.id, userRoles.roleId))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(desc(users.createdAt));

			const rows = items.map((item, i) => ({
				序号: i + 1,
				姓名: item.name,
				邮箱: item.email,
				手机号: item.phone || '-',
				角色: item.roleName || '-',
				状态: item.isActive ? '正常' : '禁用',
				创建时间: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '-'
			}));

			return {
				filename: `学员列表_${new Date().toISOString().split('T')[0]}.csv`,
				content: generateCsv(rows)
			};
		})
});

function generateCsv(rows: Record<string, string | number>[]): string {
	if (rows.length === 0) return '';

	const headers = Object.keys(rows[0]);
	const escape = (val: string | number): string => {
		const str = String(val);
		if (str.includes(',') || str.includes('"') || str.includes('\n')) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};

	const headerRow = headers.map(escape).join(',');
	const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(','));

	return '\ufeff' + [headerRow, ...dataRows].join('\n');
}
