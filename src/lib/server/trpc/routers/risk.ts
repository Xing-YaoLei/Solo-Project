import { z } from 'zod';
import { router, caregiverProcedure, managerProcedure } from '../trpc';
import { db } from '../../db';
import {
	riskEvents,
	communications,
	reviewOpinions,
	elderlyProfiles,
	users
} from '../../db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
import { generateId } from '../../utils';

export const riskRouter = router({
	list: caregiverProcedure
		.input(
			z.object({
				status: z.enum(['reported', 'investigating', 'resolved', 'closed']).optional(),
				eventType: z.enum(['fall', 'illness', 'medication_error', 'wandering', 'conflict', 'other']).optional(),
				severity: z.enum(['low', 'medium', 'high', 'critical']).optional()
			})
		)
		.query(async ({ input, ctx }) => {
			const conditions = [];
			if (input.status) conditions.push(eq(riskEvents.status, input.status));
			if (input.eventType) conditions.push(eq(riskEvents.eventType, input.eventType));
			if (input.severity) conditions.push(eq(riskEvents.severity, input.severity));

			if (ctx.user.role === 'caregiver') {
				const myElderly = await db
					.select({ id: elderlyProfiles.id })
					.from(elderlyProfiles)
					.where(eq(elderlyProfiles.caregiverId, ctx.user.id));
				const ids = myElderly.map((e) => e.id);
				if (ids.length > 0) {
					conditions.push(inArray(riskEvents.elderlyId, ids));
				} else {
					return [];
				}
			}

			return db
				.select({
					event: riskEvents,
					elderly: elderlyProfiles,
					reporter: users
				})
				.from(riskEvents)
				.innerJoin(elderlyProfiles, eq(riskEvents.elderlyId, elderlyProfiles.id))
				.innerJoin(users, eq(riskEvents.reportedBy, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(riskEvents.occurredAt));
		}),

	getById: caregiverProcedure.input(z.string()).query(async ({ input }) => {
		const eventResult = await db
			.select({
				event: riskEvents,
				elderly: elderlyProfiles,
				reporter: users
			})
			.from(riskEvents)
			.innerJoin(elderlyProfiles, eq(riskEvents.elderlyId, elderlyProfiles.id))
			.innerJoin(users, eq(riskEvents.reportedBy, users.id))
			.where(eq(riskEvents.id, input));

		const commResult = await db
			.select({
				comm: communications,
				creator: users
			})
			.from(communications)
			.innerJoin(users, eq(communications.createdBy, users.id))
			.where(eq(communications.riskEventId, input))
			.orderBy(asc(communications.createdAt));

		const reviewResult = await db
			.select({
				review: reviewOpinions,
				reviewer: users
			})
			.from(reviewOpinions)
			.innerJoin(users, eq(reviewOpinions.reviewedBy, users.id))
			.where(eq(reviewOpinions.riskEventId, input))
			.orderBy(desc(reviewOpinions.createdAt));

		return {
			event: eventResult[0],
			communications: commResult,
			reviews: reviewResult
		};
	}),

	create: caregiverProcedure
		.input(
			z.object({
				elderlyId: z.string(),
				eventType: z.enum(['fall', 'illness', 'medication_error', 'wandering', 'conflict', 'other']),
				severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
				occurredAt: z.number(),
				location: z.string().optional(),
				description: z.string().min(1),
				immediateAction: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const id = generateId();
			await db.insert(riskEvents).values({
				id,
				elderlyId: input.elderlyId,
				eventType: input.eventType,
				severity: input.severity,
				occurredAt: input.occurredAt,
				location: input.location,
				reportedBy: ctx.user.id,
				description: input.description,
				immediateAction: input.immediateAction
			});
			return id;
		}),

	updateStatus: caregiverProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(['reported', 'investigating', 'resolved', 'closed'])
			})
		)
		.mutation(async ({ input }) => {
			await db
				.update(riskEvents)
				.set({
					status: input.status,
					resolvedAt: input.status === 'resolved' || input.status === 'closed' ? Date.now() : null
				})
				.where(eq(riskEvents.id, input.id));
			return true;
		}),

	addCommunication: caregiverProcedure
		.input(
			z.object({
				riskEventId: z.string(),
				type: z.enum(['internal_note', 'family_call', 'doctor_consult', 'meeting']).default('internal_note'),
				content: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const id = generateId();
			await db.insert(communications).values({
				id,
				riskEventId: input.riskEventId,
				type: input.type,
				content: input.content,
				createdBy: ctx.user.id
			});
			return id;
		}),

	addReview: managerProcedure
		.input(
			z.object({
				riskEventId: z.string(),
				content: z.string().min(1),
				reviewResult: z.string().default('pending'),
				improvementSuggestions: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const id = generateId();
			await db.insert(reviewOpinions).values({
				id,
				riskEventId: input.riskEventId,
				content: input.content,
				reviewedBy: ctx.user.id,
				reviewResult: input.reviewResult,
				improvementSuggestions: input.improvementSuggestions
			});

			await db.update(riskEvents).set({ reviewStatus: input.reviewResult }).where(eq(riskEvents.id, input.riskEventId));
			return id;
		})
});
