import db from '../db';
import type { User, UserRole } from '$lib/types';

export interface UserRow {
	id: string;
	name: string;
	role: UserRole;
	store_id: string | null;
	password_hash: string;
}

export function findUserById(id: string): User | null {
	const row = db.prepare('SELECT id, name, role, store_id FROM users WHERE id = ?').get(id) as UserRow | undefined;
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		role: row.role,
		storeId: row.store_id ?? undefined
	};
}

export function findUserByCredentials(name: string, passwordHash: string): User | null {
	const row = db
		.prepare('SELECT id, name, role, store_id FROM users WHERE name = ? AND password_hash = ?')
		.get(name, passwordHash) as UserRow | undefined;
	if (!row) return null;
	return {
		id: row.id,
		name: row.name,
		role: row.role,
		storeId: row.store_id ?? undefined
	};
}

export function listSalesUsers(): User[] {
	const rows = db
		.prepare("SELECT id, name, role, store_id FROM users WHERE role = 'sales'")
		.all() as UserRow[];
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		role: r.role,
		storeId: r.store_id ?? undefined
	}));
}

export function hashPassword(pwd: string): string {
	let hash = 0;
	for (let i = 0; i < pwd.length; i++) {
		const char = pwd.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return 'h_' + Math.abs(hash).toString(16);
}
