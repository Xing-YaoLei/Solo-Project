import { z } from 'zod';
import { router, caregiverProcedure, nurseProcedure } from '../trpc';
import { db } from '../../db';
import {
	medications,
	medicationReminders,
	elderlyProfiles,
	type ReminderStatus
} from '../../db/schema';
import { eq, and, asc, desc, gte, lte, isNull, inArray } from 'drizzle-orm';
import { generateId } from '../../utils';

export const medicationRouter = router({
	listByElderly: caregiverProcedure.input(z.string()).query(async ({ input }) => {
		return db.select().from(medications).where(eq(medications.elderlyId, input));
	}),

	activeMedications: caregiverProcedure.query(async ({ ctx }) => {
		const conditions = [eq(medications.isActive, true)];
		if (ctx.user.role === 'caregiver') {
			const myElderly = await db
				.select({ id: elderlyProfiles.id })
				.from(elderlyProfiles)
				.where(eq(elderlyProfiles.caregiverId, ctx.user.id));
			if (myElderly.length === 0) return [];
			conditions.push(inArray(medications.elderlyId, myElderly.map((e) => e.id)));
		}
		return db
			.select()
			.from(medications)
			.innerJoin(elderlyProfiles, eq(medications.elderlyId, elderlyProfiles.id))
			.where(and(...conditions))
			.orderBy(asc(medications.createdAt));
	}),

	create: nurseProcedure
		.input(
			z.object({
				elderlyId: z.string(),
				name: z.string().min(1),
				dosage: z.string().min(1),
				frequency: z.string().min(1),
				timesPerDay: z.number().min(1),
				specificTimes: z.string().min(1),
				route: z.string().default('口服'),
				notes: z.string().optional(),
				doctorName: z.string().optional(),
				startDate: z.number().optional().nullable(),
				endDate: z.number().optional().nullable()
			})
		)
		.mutation(async ({ input }) => {
			const id = generateId();
			await db.insert(medications).values({
				id,
				...input,
				specificTimes: input.specificTimes,
				startDate: input.startDate ?? null,
				endDate: input.endDate ?? null
			});

			const times = JSON.parse(input.specificTimes) as string[];
			const today = new Date();
			for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
				for (const timeStr of times) {
					const [hours, minutes] = timeStr.split(':').map(Number);
					const scheduled = new Date(today);
					scheduled.setDate(scheduled.getDate() + dayOffset);
					scheduled.setHours(hours, minutes, 0, 0);

					await db.insert(medicationReminders).values({
						id: generateId(),
						medicationId: id,
						elderlyId: input.elderlyId,
						scheduledTime: scheduled.getTime(),
						status: 'pending'
					});
				}
			}

			return id;
		}),

	toggleActive: nurseProcedure
		.input(
			z.object({
				id: z.string(),
				isActive: z.boolean()
			})
		)
		.mutation(async ({ input }) => {
			await db.update(medications).set({ isActive: input.isActive }).where(eq(medications.id, input.id));
			return true;
		}),

	reminders: caregiverProcedure
		.input(
			z.object({
				date: z.number().optional(),
				status: z.enum(['pending', 'taken', 'missed', 'skipped']).optional(),
				elderlyId: z.string().optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const conditions = [];

			if (input.date) {
				const dayStart = new Date(input.date);
				dayStart.setHours(0, 0, 0, 0);
				const dayEnd = new Date(input.date);
				dayEnd.setHours(23, 59, 59, 999);
				conditions.push(gte(medicationReminders.scheduledTime, dayStart.getTime()));
				conditions.push(lte(medicationReminders.scheduledTime, dayEnd.getTime()));
			}

			if (input.status) {
				conditions.push(eq(medicationReminders.status, input.status));
			}

			if (input.elderlyId) {
				conditions.push(eq(medicationReminders.elderlyId, input.elderlyId));
			}

			if (ctx.user.role === 'caregiver') {
				const myElderly = await db
					.select({ id: elderlyProfiles.id })
					.from(elderlyProfiles)
					.where(eq(elderlyProfiles.caregiverId, ctx.user.id));
				const ids = myElderly.map((e) => e.id);
				if (ids.length > 0) {
					conditions.push(inArray(medicationReminders.elderlyId, ids));
				} else {
					return [];
				}
			}

			return db
				.select({
					reminder: medicationReminders,
					medication: medications,
					elderly: elderlyProfiles
				})
				.from(medicationReminders)
				.innerJoin(medications, eq(medicationReminders.medicationId, medications.id))
				.innerJoin(elderlyProfiles, eq(medicationReminders.elderlyId, elderlyProfiles.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(asc(medicationReminders.scheduledTime));
		}),

	updateReminderStatus: caregiverProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['pending', 'taken', 'missed', 'skipped']),
				notes: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			await db
				.update(medicationReminders)
				.set({
					status: input.status as ReminderStatus,
					actualTime: input.status === 'taken' ? Date.now() : null,
					administeredBy: input.status === 'taken' ? ctx.user.id : null,
					notes: input.notes
				})
				.where(eq(medicationReminders.id, input.id));
			return true;
		})
});
