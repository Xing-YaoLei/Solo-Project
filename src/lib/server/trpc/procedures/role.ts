import { router, authedProcedure, createPermissionGuard } from '$server/trpc/context';
import { z } from 'zod';
import { db } from '$server/db';
import { roles, permissions, rolePermissions } from '$server/db/schema';
import { eq, sql } from 'drizzle-orm';

const roleViewGuard = authedProcedure.use(createPermissionGuard(['role:view']));
const roleManageGuard = authedProcedure.use(createPermissionGuard(['role:manage']));

export const roleRouter = router({
	list: roleViewGuard.query(async () => {
		const roleRows = await db.select().from(roles);
		const permRows = await db
			.select({
				roleId: rolePermissions.roleId,
				permissionId: permissions.id,
				permissionCode: permissions.code,
				permissionLabel: permissions.label,
				permissionCategory: permissions.category
			})
			.from(rolePermissions)
			.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

		const permMap = new Map<string, { permissionId: string; permissionCode: string; permissionLabel: string; permissionCategory: string }[]>();
		for (const p of permRows) {
			if (!permMap.has(p.roleId)) permMap.set(p.roleId, []);
			permMap.get(p.roleId)!.push({
				permissionId: p.permissionId,
				permissionCode: p.permissionCode,
				permissionLabel: p.permissionLabel,
				permissionCategory: p.permissionCategory
			});
		}

		return roleRows.map((r) => ({
			...r,
			permissions: permMap.get(r.id) ?? []
		}));
	}),

	updatePermissions: roleManageGuard
		.input(z.object({
			roleId: z.string(),
			permissionCodes: z.array(z.string())
		}))
		.mutation(async ({ input }) => {
			await db.delete(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));

			if (input.permissionCodes.length > 0) {
				const permRows = await db
					.select({ id: permissions.id })
					.from(permissions)
					.where(sql`${permissions.code} IN ${input.permissionCodes}`);

				if (permRows.length > 0) {
					await db.insert(rolePermissions).values(
						permRows.map((p) => ({
							roleId: input.roleId,
							permissionId: p.id
						}))
					);
				}
			}

			return { success: true };
		})
});
