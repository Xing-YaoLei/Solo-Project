import { db } from '$lib/server/db';
import { refundOrderTable, refundLogTable, timeoutDictionaryTable, escalationRuleTable, userTable } from '$lib/server/db/schema';
import { eq, and, lt, ne, isNotNull } from 'drizzle-orm';

export async function getDueAt(status: string): Promise<Date | null> {
	const configs = await db
		.select()
		.from(timeoutDictionaryTable)
		.where(and(eq(timeoutDictionaryTable.statusKey, status), eq(timeoutDictionaryTable.enabled, true)));

	if (configs.length === 0) return null;
	const timeoutHours = configs[0].timeoutHours;
	return new Date(Date.now() + timeoutHours * 60 * 60 * 1000);
}

export async function getDueAtFromNow(status: string, baseDate: Date): Promise<Date | null> {
	const configs = await db
		.select()
		.from(timeoutDictionaryTable)
		.where(and(eq(timeoutDictionaryTable.statusKey, status), eq(timeoutDictionaryTable.enabled, true)));

	if (configs.length === 0) return null;
	const timeoutHours = configs[0].timeoutHours;
	return new Date(baseDate.getTime() + timeoutHours * 60 * 60 * 1000);
}

export async function resolveEscalationTarget(
	rule: { escalateToUserId?: string | null; escalateToRole?: string | null; name: string; level: number }
): Promise<{ id: string; name: string } | null> {
	if (rule.escalateToUserId) {
		const targetUser = await db
			.select()
			.from(userTable)
			.where(eq(userTable.id, rule.escalateToUserId))
			.limit(1);
		if (targetUser.length > 0) {
			return {
				id: targetUser[0].id,
				name: targetUser[0].realName || targetUser[0].username
			};
		}
	}

	if (rule.escalateToRole) {
		const targetUsers = await db
			.select()
			.from(userTable)
			.where(eq(userTable.role, rule.escalateToRole))
			.limit(1);
		if (targetUsers.length > 0) {
			return {
				id: targetUsers[0].id,
				name: targetUsers[0].realName || targetUsers[0].username
			};
		}
	}

	return null;
}

export async function resolveEscalationTargetWithFallback(
	rule: { escalateToUserId?: string | null; escalateToRole?: string | null; name: string; level: number }
): Promise<{ id: string; name: string; viaFallback: boolean } | null> {
	const direct = await resolveEscalationTarget(rule);
	if (direct) {
		return { ...direct, viaFallback: false };
	}

	const admins = await db
		.select()
		.from(userTable)
		.where(eq(userTable.role, 'admin'))
		.limit(1);
	if (admins.length > 0) {
		return {
			id: admins[0].id,
			name: admins[0].realName || admins[0].username,
			viaFallback: true
		};
	}

	return null;
}

export async function checkAndProcessTimeouts(): Promise<number> {
	const now = new Date();

	const overdueOrders = await db
		.select()
		.from(refundOrderTable)
		.where(
			and(
				isNotNull(refundOrderTable.dueAt),
				lt(refundOrderTable.dueAt, now),
				ne(refundOrderTable.status, 'closed')
			)
		);

	let processed = 0;

	for (const order of overdueOrders) {
		const alreadyTimedOut = await db
			.select({ id: refundLogTable.id })
			.from(refundLogTable)
			.where(
				and(
					eq(refundLogTable.refundOrderId, order.id),
					eq(refundLogTable.actionType, 'timeout_trigger')
				)
			)
			.limit(1);

		if (alreadyTimedOut.length > 0) continue;

		const escalationRules = await db
			.select()
			.from(escalationRuleTable)
			.where(eq(escalationRuleTable.enabled, true))
			.orderBy(escalationRuleTable.level)
			.limit(1);

		let newHandlerId = order.currentHandlerId;
		let newHandlerName = order.currentHandlerName;
		let escalateInfo = '超时未处理，已标记为超时待办';

		if (escalationRules.length > 0) {
			const rule = escalationRules[0];
			const target = await resolveEscalationTargetWithFallback(rule);
			if (target) {
				newHandlerId = target.id;
				newHandlerName = target.name;
				escalateInfo = target.viaFallback
					? `按规则「${rule.name}」升级: 目标角色「${rule.escalateToRole}」无匹配用户，已 fallback 分派给 ${newHandlerName}（管理员）`
					: `按规则「${rule.name}」升级，分派给: ${newHandlerName}`;
			}
		}

		const escalatedDueAt = await getDueAt('escalated');

		await db
			.update(refundOrderTable)
			.set({
				currentHandlerId: newHandlerId,
				currentHandlerName: newHandlerName,
				status: 'escalated',
				dueAt: escalatedDueAt,
				updatedAt: now
			})
			.where(eq(refundOrderTable.id, order.id));

		await db.insert(refundLogTable).values({
			refundOrderId: order.id,
			actionType: 'timeout_trigger',
			actionDetail: `处理超时触发: 截止时间 ${order.dueAt?.toISOString()}，${escalateInfo}${escalatedDueAt ? '，新截止: ' + escalatedDueAt.toISOString() : ''}`,
			oldStatus: order.status,
			newStatus: 'escalated',
			oldHandlerId: order.currentHandlerId,
			newHandlerId,
			operatorName: '系统',
			createdAt: now
		});

		processed++;
	}

	return processed;
}
