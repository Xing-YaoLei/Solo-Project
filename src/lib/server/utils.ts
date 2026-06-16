import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';

export async function hashPassword(password: string): Promise<string> {
	const hash = await sha256(new TextEncoder().encode(password));
	return encodeHex(hash);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	const passwordHash = encodeHex(await sha256(new TextEncoder().encode(password)));
	return passwordHash === hash;
}

export function generateId(): string {
	return (
		Date.now().toString(36) +
		Math.random().toString(36).substring(2, 10) +
		Math.random().toString(36).substring(2, 10)
	);
}

export function formatDate(date: Date | number | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'number' ? new Date(date) : date;
	return d.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatDateTime(date: Date | number | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'number' ? new Date(date) : date;
	return d.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatTime(date: Date | number | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'number' ? new Date(date) : date;
	return d.toLocaleTimeString('zh-CN', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function calculateAge(birthDate: Date | number | null | undefined): number | null {
	if (!birthDate) return null;
	const birth = typeof birthDate === 'number' ? new Date(birthDate) : birthDate;
	const today = new Date();
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}
