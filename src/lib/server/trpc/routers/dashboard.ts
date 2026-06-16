import { z } from 'zod';
import { router, managerProcedure } from '../trpc';
import { db } from '../../db';
import {
	medicationReminders,
	activityCheckins,
	riskEvents,
	elderlyProfiles,
	careCompliance
} from '../../db/schema';
import { eq, and, or, gte, lte, desc, count, avg, sql } from 'drizzle-orm';

export const dashboardRouter = router({
	overview: managerProcedure.query(async () => {
		const now = Date.now();
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);
		const todayStartTs = todayStart.getTime();
		const todayEnd = new Date();
		todayEnd.setHours(23, 59, 59, 999);
		const todayEndTs = todayEnd.getTime();

		const totalElderly = (await db.select({ value: count() }).from(elderlyProfiles))[0].value;

		const todayMedReminders = await db
			.select({ value: count() })
			.from(medicationReminders)
			.where(and(gte(medicationReminders.scheduledTime, todayStartTs), lte(medicationReminders.scheduledTime, todayEndTs)));

		const todayMedTaken = await db
			.select({ value: count() })
			.from(medicationReminders)
			.where(
				and(
					gte(medicationReminders.scheduledTime, todayStartTs),
					lte(medicationReminders.scheduledTime, todayEndTs),
					eq(medicationReminders.status, 'taken')
				)
			);

		const todayActivities = await db
			.select({ value: count() })
			.from(activityCheckins)
			.where(and(gte(activityCheckins.checkinTime, todayStartTs), lte(activityCheckins.checkinTime, todayEndTs)));

		const openRiskEvents = await db
			.select({ value: count() })
			.from(riskEvents)
			.where(or(eq(riskEvents.status, 'reported'), eq(riskEvents.status, 'investigating')));

		const pendingReminders = await db
			.select({
				reminder: medicationReminders,
				elderly: elderlyProfiles
			})
			.from(medicationReminders)
			.innerJoin(elderlyProfiles, eq(medicationReminders.elderlyId, elderlyProfiles.id))
			.where(and(eq(medicationReminders.status, 'pending'), lte(medicationReminders.scheduledTime, now)))
			.orderBy(medicationReminders.scheduledTime)
			.limit(10);

		const recentRisk = await db
			.select({
				event: riskEvents,
				elderly: elderlyProfiles
			})
			.from(riskEvents)
			.innerJoin(elderlyProfiles, eq(riskEvents.elderlyId, elderlyProfiles.id))
			.orderBy(desc(riskEvents.occurredAt))
			.limit(5);

		return {
			totalElderly,
			todayMedReminders: todayMedReminders[0].value,
			todayMedTaken: todayMedTaken[0].value,
			todayActivities: todayActivities[0].value,
			openRiskEvents: openRiskEvents[0].value,
			pendingReminders,
			recentRisk
		};
	}),

	complianceTrend: managerProcedure
		.input(
			z.object({
				days: z.number().default(30)
			})
		)
		.query(async ({ input }) => {
			const daysAgo = new Date();
			daysAgo.setDate(daysAgo.getDate() - input.days);
			daysAgo.setHours(0, 0, 0, 0);

			return db
				.select({
					date: careCompliance.date,
					medicationComplianceRate: careCompliance.medicationComplianceRate,
					activityComplianceRate: careCompliance.activityComplianceRate,
					overallComplianceRate: careCompliance.overallComplianceRate
				})
				.from(careCompliance)
				.where(gte(careCompliance.date, daysAgo.getTime()))
				.orderBy(careCompliance.date);
		}),

	riskStats: managerProcedure.query(async () => {
		const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
		return db
			.select({
				eventType: riskEvents.eventType,
				count: count()
			})
			.from(riskEvents)
			.where(gte(riskEvents.occurredAt, thirtyDaysAgo))
			.groupBy(riskEvents.eventType);
	})
});
