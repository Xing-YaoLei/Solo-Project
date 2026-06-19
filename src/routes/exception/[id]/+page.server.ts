import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { exceptionRecord, exceptionAction, performance, user } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;

	const [exc] = await db
		.select({
			id: exceptionRecord.id,
			performance_id: exceptionRecord.performance_id,
			type: exceptionRecord.type,
			status: exceptionRecord.status,
			description: exceptionRecord.description,
			handler_id: exceptionRecord.handler_id,
			resolution: exceptionRecord.resolution,
			source: exceptionRecord.source,
			created_at: exceptionRecord.created_at,
			updated_at: exceptionRecord.updated_at
		})
		.from(exceptionRecord)
		.where(eq(exceptionRecord.id, id));

	if (!exc) {
		throw redirect(302, '/exceptions');
	}

	const [perf] = await db
		.select({
			id: performance.id,
			title: performance.title
		})
		.from(performance)
		.where(eq(performance.id, exc.performance_id));

	let handler = null;
	if (exc.handler_id) {
		const [h] = await db
			.select({
				id: user.id,
				display_name: user.display_name,
				username: user.username
			})
			.from(user)
			.where(eq(user.id, exc.handler_id));
		handler = h ?? null;
	}

	const actions = await db
		.select({
			id: exceptionAction.id,
			action_type: exceptionAction.action_type,
			content: exceptionAction.content,
			operator_id: exceptionAction.operator_id,
			operator_name: user.display_name,
			operator_username: user.username,
			created_at: exceptionAction.created_at
		})
		.from(exceptionAction)
		.leftJoin(user, eq(exceptionAction.operator_id, user.id))
		.where(eq(exceptionAction.exception_id, id))
		.orderBy(desc(exceptionAction.created_at));

	const users = await db
		.select({
			id: user.id,
			display_name: user.display_name,
			username: user.username
		})
		.from(user);

	return {
		exception: exc,
		actions,
		performance: perf ?? null,
		handler,
		users
	};
};

export const actions: Actions = {
	assign: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const handler_id = formData.get('handler_id') as string;

		if (!handler_id) {
			return fail(400, { message: '请选择处理人' });
		}

		await db
			.update(exceptionRecord)
			.set({ handler_id, status: 'processing', updated_at: new Date() })
			.where(eq(exceptionRecord.id, params.id));

		await db.insert(exceptionAction).values({
			exception_id: params.id,
			action_type: 'status_change',
			content: '分配处理人',
			operator_id: locals.user!.id
		});

		throw redirect(302, `/exception/${params.id}`);
	},

	resolve: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const resolution = formData.get('resolution') as string;

		if (!resolution) {
			return fail(400, { message: '请填写处理结果' });
		}

		await db
			.update(exceptionRecord)
			.set({ status: 'resolved', resolution, updated_at: new Date() })
			.where(eq(exceptionRecord.id, params.id));

		await db.insert(exceptionAction).values({
			exception_id: params.id,
			action_type: 'resolve',
			content: resolution,
			operator_id: locals.user!.id
		});

		throw redirect(302, `/exception/${params.id}`);
	},

	requestDocs: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const content = formData.get('content') as string;

		if (!content) {
			return fail(400, { message: '请填写所需资料说明' });
		}

		await db
			.update(exceptionRecord)
			.set({ status: 'missing_docs', updated_at: new Date() })
			.where(eq(exceptionRecord.id, params.id));

		await db.insert(exceptionAction).values({
			exception_id: params.id,
			action_type: 'request_docs',
			content,
			operator_id: locals.user!.id
		});

		throw redirect(302, `/exception/${params.id}`);
	},

	escalate: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const content = formData.get('content') as string;

		if (!content) {
			return fail(400, { message: '请填写升级原因' });
		}

		await db
			.update(exceptionRecord)
			.set({ status: 'escalated', updated_at: new Date() })
			.where(eq(exceptionRecord.id, params.id));

		await db.insert(exceptionAction).values({
			exception_id: params.id,
			action_type: 'escalate',
			content,
			operator_id: locals.user!.id
		});

		throw redirect(302, `/exception/${params.id}`);
	},

	addComment: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const content = formData.get('content') as string;

		if (!content) {
			return fail(400, { message: '请填写备注内容' });
		}

		await db.insert(exceptionAction).values({
			exception_id: params.id,
			action_type: 'comment',
			content,
			operator_id: locals.user!.id
		});

		throw redirect(302, `/exception/${params.id}`);
	},

	close: async ({ params, locals }) => {
		await db
			.update(exceptionRecord)
			.set({ status: 'closed', updated_at: new Date() })
			.where(eq(exceptionRecord.id, params.id));

		await db.insert(exceptionAction).values({
			exception_id: params.id,
			action_type: 'status_change',
			content: '关闭记录',
			operator_id: locals.user!.id
		});

		throw redirect(302, `/exception/${params.id}`);
	}
};
