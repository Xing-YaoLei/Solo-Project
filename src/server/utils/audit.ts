import { db } from '$server/db';
import { auditLog } from '$server/db/schema';
import type { DB } from '$server/db';

export interface AuditLogOptions {
	action: string;
	entityType: string;
	entityId: string;
	field?: string;
	oldValue?: unknown;
	newValue?: unknown;
	meta?: Record<string, unknown>;
}

export async function createAuditLog(
	options: AuditLogOptions,
	userId: string | null,
	database: DB = db
) {
	await database.insert(auditLog).values({
		id: crypto.randomUUID(),
		userId,
		action: options.action,
		entityType: options.entityType,
		entityId: options.entityId,
		field: options.field,
		oldValue: options.oldValue ?? undefined,
		newValue: options.newValue ?? undefined,
		meta: options.meta
	});
}

export function diffObject(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): { field: string; old: unknown; new: unknown }[] {
	const changes: { field: string; old: unknown; new: unknown }[] = [];
	const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

	for (const key of allKeys) {
		const oldVal = oldObj[key];
		const newVal = newObj[key];
		if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
			changes.push({ field: key, old: oldVal, new: newVal });
		}
	}

	return changes;
}
