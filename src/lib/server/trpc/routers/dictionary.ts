import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';
import { db } from '$lib/server/db';
import {
	timeoutDictionaryTable,
	escalationRuleTable,
	followupThresholdTable,
	issueTagTable,
	responsibilityDictTable
} from '$lib/server/db/schema';
import { eq, asc, desc } from 'drizzle-orm';

export const dictionaryRouter = createTRPCRouter({
	getTimeoutDictionary: publicProcedure.query(async () => {
		return await db
			.select()
			.from(timeoutDictionaryTable)
			.where(eq(timeoutDictionaryTable.enabled, true))
			.orderBy(asc(timeoutDictionaryTable.timeoutHours));
	}),

	updateTimeoutDictionary: protectedProcedure
		.input(
			z.array(
				z.object({
					id: z.string().optional(),
					statusKey: z.string(),
					statusName: z.string(),
					timeoutHours: z.number(),
					description: z.string().optional(),
					enabled: z.boolean().default(true)
				})
			)
		)
		.mutation(async ({ input }) => {
			for (const item of input) {
				if (item.id) {
					await db
						.update(timeoutDictionaryTable)
						.set({
							statusKey: item.statusKey,
							statusName: item.statusName,
							timeoutHours: item.timeoutHours,
							description: item.description,
							enabled: item.enabled,
							updatedAt: new Date()
						})
						.where(eq(timeoutDictionaryTable.id, item.id));
				} else {
					await db.insert(timeoutDictionaryTable).values({
						statusKey: item.statusKey,
						statusName: item.statusName,
						timeoutHours: item.timeoutHours,
						description: item.description,
						enabled: item.enabled
					});
				}
			}
			return { success: true };
		}),

	getEscalationRules: protectedProcedure.query(async () => {
		return await db
			.select()
			.from(escalationRuleTable)
			.where(eq(escalationRuleTable.enabled, true))
			.orderBy(asc(escalationRuleTable.level));
	}),

	updateEscalationRules: protectedProcedure
		.input(
			z.array(
				z.object({
					id: z.string().optional(),
					name: z.string(),
					triggerCondition: z.string(),
					escalateToRole: z.string(),
					escalateToUserId: z.string().optional(),
					level: z.number(),
					enabled: z.boolean().default(true)
				})
			)
		)
		.mutation(async ({ input }) => {
			for (const item of input) {
				if (item.id) {
					await db
						.update(escalationRuleTable)
						.set({
							name: item.name,
							triggerCondition: item.triggerCondition,
							escalateToRole: item.escalateToRole,
							escalateToUserId: item.escalateToUserId,
							level: item.level,
							enabled: item.enabled,
							updatedAt: new Date()
						})
						.where(eq(escalationRuleTable.id, item.id));
				} else {
					await db.insert(escalationRuleTable).values({
						name: item.name,
						triggerCondition: item.triggerCondition,
						escalateToRole: item.escalateToRole,
						escalateToUserId: item.escalateToUserId,
						level: item.level,
						enabled: item.enabled
					});
				}
			}
			return { success: true };
		}),

	getFollowupThresholds: protectedProcedure.query(async () => {
		return await db
			.select()
			.from(followupThresholdTable)
			.where(eq(followupThresholdTable.enabled, true))
			.orderBy(asc(followupThresholdTable.resultKey));
	}),

	updateFollowupThresholds: protectedProcedure
		.input(
			z.array(
				z.object({
					id: z.string().optional(),
					resultKey: z.string(),
					resultName: z.string(),
					requiresReview: z.boolean(),
					warningThreshold: z.number().optional(),
					description: z.string().optional(),
					enabled: z.boolean().default(true)
				})
			)
		)
		.mutation(async ({ input }) => {
			for (const item of input) {
				if (item.id) {
					await db
						.update(followupThresholdTable)
						.set({
							resultKey: item.resultKey,
							resultName: item.resultName,
							requiresReview: item.requiresReview,
							warningThreshold: item.warningThreshold,
							description: item.description,
							enabled: item.enabled,
							updatedAt: new Date()
						})
						.where(eq(followupThresholdTable.id, item.id));
				} else {
					await db.insert(followupThresholdTable).values({
						resultKey: item.resultKey,
						resultName: item.resultName,
						requiresReview: item.requiresReview,
						warningThreshold: item.warningThreshold,
						description: item.description,
						enabled: item.enabled
					});
				}
			}
			return { success: true };
		}),

	getIssueTags: publicProcedure.query(async () => {
		return await db
			.select()
			.from(issueTagTable)
			.where(eq(issueTagTable.enabled, true))
			.orderBy(asc(issueTagTable.sortOrder));
	}),

	updateIssueTags: protectedProcedure
		.input(
			z.array(
				z.object({
					id: z.string().optional(),
					name: z.string(),
					category: z.string().optional(),
					color: z.string().optional(),
					sortOrder: z.number().default(0),
					enabled: z.boolean().default(true)
				})
			)
		)
		.mutation(async ({ input }) => {
			for (const item of input) {
				if (item.id) {
					await db
						.update(issueTagTable)
						.set({
							name: item.name,
							category: item.category,
							color: item.color,
							sortOrder: item.sortOrder,
							enabled: item.enabled
						})
						.where(eq(issueTagTable.id, item.id));
				} else {
					await db.insert(issueTagTable).values({
						name: item.name,
						category: item.category,
						color: item.color,
						sortOrder: item.sortOrder,
						enabled: item.enabled
					});
				}
			}
			return { success: true };
		}),

	getResponsibilityDict: publicProcedure.query(async () => {
		return await db
			.select()
			.from(responsibilityDictTable)
			.where(eq(responsibilityDictTable.enabled, true))
			.orderBy(asc(responsibilityDictTable.sortOrder));
	}),

	updateResponsibilityDict: protectedProcedure
		.input(
			z.array(
				z.object({
					id: z.string().optional(),
					key: z.string(),
					name: z.string(),
					department: z.string().optional(),
					sortOrder: z.number().default(0),
					enabled: z.boolean().default(true)
				})
			)
		)
		.mutation(async ({ input }) => {
			for (const item of input) {
				if (item.id) {
					await db
						.update(responsibilityDictTable)
						.set({
							key: item.key,
							name: item.name,
							department: item.department,
							sortOrder: item.sortOrder,
							enabled: item.enabled
						})
						.where(eq(responsibilityDictTable.id, item.id));
				} else {
					await db.insert(responsibilityDictTable).values({
						key: item.key,
						name: item.name,
						department: item.department,
						sortOrder: item.sortOrder,
						enabled: item.enabled
					});
				}
			}
			return { success: true };
		})
});
