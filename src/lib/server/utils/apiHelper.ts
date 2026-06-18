import type { RequestEvent } from '@sveltejs/kit';
import type { User, UserRole } from '$lib/types';
import { json } from '@sveltejs/kit';

export function requireAuth(event: RequestEvent): User {
	const user = event.locals.user;
	if (!user) {
		throw json({ error: '未登录' }, { status: 401 });
	}
	return user;
}

export function requireRole(event: RequestEvent, roles: UserRole[]): User {
	const user = requireAuth(event);
	if (!roles.includes(user.role)) {
		throw json({ error: '无权限访问' }, { status: 403 });
	}
	return user;
}

export function getScopeFilter(user: User): { salespersonId?: string } {
	if (user.role === 'sales') {
		return { salespersonId: user.id };
	}
	return {};
}

export function acceptArrow(event: RequestEvent): boolean {
	const accept = event.request.headers.get('accept') ?? '';
	return accept.includes('application/vnd.apache.arrow.file') || accept.includes('application/arrow');
}

export function arrowResponse(data: Uint8Array): Response {
	const sliced = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
	return new Response(sliced as unknown as BodyInit, {
		headers: {
			'content-type': 'application/vnd.apache.arrow.file'
		}
	});
}
