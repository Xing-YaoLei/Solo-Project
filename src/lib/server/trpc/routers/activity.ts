import { z } from 'zod';
import { router, caregiverProcedure } from '../trpc';
import { db } from '../../db';
import { activityCheckins, elderlyProfiles, users } from '../../db/schema';
import { eq, and, gte, lte, asc, desc, inArray } from 'drizzle-orm';
import { generateId } from '../../utils';

export const activityRouter = router({
	list: caregiverProcedure
		.input(
			z.object({
				date: z.number().optional(),
				elderlyId: z.string().optional(),
				activityType: z.string().optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const conditions = [];

			if (input.date) {
				const dayStart = new Date(input.date);
				dayStart.setHours(0, 0, 0, 0);
				const dayEnd = new Date(input.date);
				dayEnd.setHours(23, 59, 59, 999);
				conditions.push(gte(activityCheckins.checkinTime, dayStart.getTime()));
				conditions.push(lte(activityCheckins.checkinTime, dayEnd.getTime()));
			}

			if (input.elderlyId) {
				conditions.push(eq(activityCheckins.elderlyId, input.elderlyId));
			}

			if (input.activityType) {
				conditions.push(eq(activityCheckins.activityType, input.activityType));
			}

			if (ctx.user.role === 'caregiver') {
				const myElderly = await db
					.select({ id: elderlyProfiles.id })
					.from(elderlyProfiles)
					.where(eq(elderlyProfiles.caregiverId, ctx.user.id));
				const ids = myElderly.map((e) => e.id);
				if (ids.length > 0) {
					conditions.push(inArray(activityCheckins.elderlyId, ids));
				} else {
					return [];
				}
			}

			return db
				.select({
					checkin: activityCheckins,
					elderly: elderlyProfiles,
					checker: users
				})
				.from(activityCheckins)
				.innerJoin(elderlyProfiles, eq(activityCheckins.elderlyId, elderlyProfiles.id))
				.innerJoin(users, eq(activityCheckins.checkedInBy, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(activityCheckins.checkinTime));
		}),

	create: caregiverProcedure
		.input(
			z.object({
				elderlyId: z.string(),
				activityType: z.enum([
					'morning_exercise',
					'recreational',
					'meal',
					'rest',
					'therapy',
					'walk',
					'other'
				]),
				activityName: z.string().min(1),
				participationStatus: z.string().default('participated'),
				durationMinutes: z.number().optional(),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const id = generateId();
			await db.insert(activityCheckins).values({
				id,
				elderlyId: input.elderlyId,
				activityType: input.activityType,
				activityName: input.activityName,
				checkedInBy: ctx.user.id,
				participationStatus: input.participationStatus,
				durationMinutes: input.durationMinutes,
				notes: input.notes
			});
			return id;
		})
});
