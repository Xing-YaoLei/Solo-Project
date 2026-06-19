import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { performance, user, seatZone, checkinCode, sponsor, exceptionRecord } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const id = params.id;

	const [perf] = await db
		.select({
			id: performance.id,
			title: performance.title,
			venue: performance.venue,
			show_date: performance.show_date,
			duration_minutes: performance.duration_minutes,
			status: performance.status,
			assignee_id: performance.assignee_id,
			description: performance.description,
			created_at: performance.created_at,
			updated_at: performance.updated_at,
			assignee_name: user.display_name,
			assignee_username: user.username
		})
		.from(performance)
		.leftJoin(user, eq(performance.assignee_id, user.id))
		.where(eq(performance.id, id));

	if (!perf) {
		throw redirect(302, '/performances');
	}

	const zones = await db
		.select()
		.from(seatZone)
		.where(eq(seatZone.performance_id, id));

	const codes = await db
		.select({
			id: checkinCode.id,
			code: checkinCode.code,
			ticket_type: checkinCode.ticket_type,
			seat_zone_id: checkinCode.seat_zone_id,
			status: checkinCode.status,
			used_at: checkinCode.used_at,
			created_at: checkinCode.created_at,
			zone_name: seatZone.zone_name
		})
		.from(checkinCode)
		.leftJoin(seatZone, eq(checkinCode.seat_zone_id, seatZone.id))
		.where(eq(checkinCode.performance_id, id));

	const sponsorsList = await db
		.select()
		.from(sponsor)
		.where(eq(sponsor.performance_id, id));

	const exceptions = await db
		.select()
		.from(exceptionRecord)
		.where(eq(exceptionRecord.performance_id, id));

	const users = await db
		.select({
			id: user.id,
			display_name: user.display_name,
			username: user.username
		})
		.from(user);

	return {
		performance: perf,
		seatZones: zones,
		checkinCodes: codes,
		sponsors: sponsorsList,
		exceptions,
		users
	};
};

export const actions: Actions = {
	changeStatus: async ({ request, params }) => {
		const formData = await request.formData();
		const status = formData.get('status') as string;

		await db
			.update(performance)
			.set({ status, updated_at: new Date() })
			.where(eq(performance.id, params.id));

		throw redirect(302, `/performance/${params.id}`);
	},

	addSeatZone: async ({ request, params }) => {
		const formData = await request.formData();
		const zone_name = formData.get('zone_name') as string;
		const zone_type = formData.get('zone_type') as string;
		const total_seats = formData.get('total_seats') as string;
		const available_seats = formData.get('available_seats') as string;
		const price = formData.get('price') as string;

		if (!zone_name || !zone_type || !total_seats || !available_seats || !price) {
			return fail(400, { message: '请填写所有必填字段' });
		}

		await db.insert(seatZone).values({
			performance_id: params.id,
			zone_name,
			zone_type,
			total_seats: Number(total_seats),
			available_seats: Number(available_seats),
			price
		});

		throw redirect(302, `/performance/${params.id}`);
	},

	deleteSeatZone: async ({ request, params }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await db.delete(seatZone).where(eq(seatZone.id, id));

		throw redirect(302, `/performance/${params.id}`);
	},

	addCheckinCode: async ({ request, params }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string;
		const ticket_type = formData.get('ticket_type') as string;
		const seat_zone_id = formData.get('seat_zone_id') as string;

		if (!code || !ticket_type) {
			return fail(400, { message: '请填写所有必填字段' });
		}

		await db.insert(checkinCode).values({
			performance_id: params.id,
			code,
			ticket_type,
			seat_zone_id: seat_zone_id || null
		});

		throw redirect(302, `/performance/${params.id}`);
	},

	batchCheckinCodes: async ({ request, params }) => {
		const formData = await request.formData();
		const count = Number(formData.get('count'));
		const ticket_type = formData.get('ticket_type') as string;
		const seat_zone_id = formData.get('seat_zone_id') as string;

		if (!count || count < 1 || !ticket_type) {
			return fail(400, { message: '请填写所有必填字段' });
		}

		const values = [];
		for (let i = 0; i < count; i++) {
			const code = `${ticket_type.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${i}`;
			values.push({
				performance_id: params.id,
				code,
				ticket_type,
				seat_zone_id: seat_zone_id || null
			});
		}

		await db.insert(checkinCode).values(values);

		throw redirect(302, `/performance/${params.id}`);
	},

	markCheckinUsed: async ({ request, params }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await db
			.update(checkinCode)
			.set({ status: 'used', used_at: new Date() })
			.where(eq(checkinCode.id, id));

		throw redirect(302, `/performance/${params.id}`);
	},

	markCheckinExpired: async ({ request, params }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await db
			.update(checkinCode)
			.set({ status: 'expired' })
			.where(eq(checkinCode.id, id));

		throw redirect(302, `/performance/${params.id}`);
	},

	addSponsor: async ({ request, params }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const contact = formData.get('contact') as string;
		const tier = formData.get('tier') as string;
		const amount = formData.get('amount') as string;
		const notes = formData.get('notes') as string;

		if (!name || !tier || !amount) {
			return fail(400, { message: '请填写所有必填字段' });
		}

		await db.insert(sponsor).values({
			performance_id: params.id,
			name,
			contact: contact || null,
			tier,
			amount,
			notes: notes || null
		});

		throw redirect(302, `/performance/${params.id}`);
	},

	deleteSponsor: async ({ request, params }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await db.delete(sponsor).where(eq(sponsor.id, id));

		throw redirect(302, `/performance/${params.id}`);
	}
};
