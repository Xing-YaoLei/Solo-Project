import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, adminProcedure } from '../trpc/trpc';
import { and, desc, eq, sql, count, inArray } from 'drizzle-orm';
import {
	seatMaps,
	seats,
	ticketTypes,
	statusTransitions,
	type NewSeatMap,
	type NewSeat
} from '../db/schema';
import type { SeatStatus, SeatZone, LayoutType } from '$lib/shared/types';
import { randomUUID } from 'crypto';

export const seatRouter = router({
	getSeatMap: protectedProcedure
		.input(z.object({ eventId: z.string().optional(), seatMapId: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const seatMap = input.seatMapId
				? await ctx.db.query.seatMaps.findFirst({ where: eq(seatMaps.id, input.seatMapId) })
				: await ctx.db.query.seatMaps.findFirst({
						where: input.eventId ? eq(seatMaps.eventId, input.eventId) : undefined,
						orderBy: desc(seatMaps.createdAt)
					});

			if (!seatMap) return { seatMap: null, seats: [], statistics: null };

			const seatList = await ctx.db
				.select()
				.from(seats)
				.where(eq(seats.seatMapId, seatMap.id))
				.orderBy(seats.rowNo, seats.colNo);

			const stats = await ctx.db
				.select({
					status: seats.status,
					count: count()
				})
				.from(seats)
				.where(eq(seats.seatMapId, seatMap.id))
				.groupBy(seats.status);

			const statistics = {
				total: seatList.length,
				available: 0,
				sold: 0,
				held: 0,
				reserved: 0,
				disabled: 0,
				notForSale: 0
			};

			for (const s of stats) {
				(statistics as any)[s.status] = Number(s.count);
			}

			return { seatMap, seats: seatList, statistics };
		}),

	listSeatMaps: protectedProcedure
		.input(z.object({ eventId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db
				.select()
				.from(seatMaps)
				.where(eq(seatMaps.eventId, input.eventId))
				.orderBy(desc(seatMaps.createdAt));
		}),

	createSeatMap: operatorProcedure
		.input(
			z.object({
				eventId: z.string(),
				name: z.string().min(1),
				layoutType: z.string(),
				rows: z.number().min(1).optional(),
				cols: z.number().min(1).optional(),
				zones: z
					.array(
						z.object({
							id: z.string(),
							name: z.string(),
							priceTier: z.string().optional(),
							rowRange: z.tuple([z.number(), z.number()]).optional(),
							colRange: z.tuple([z.number(), z.number()]).optional(),
							color: z.string().optional()
						})
					)
					.optional(),
				layoutConfig: z.record(z.any()).optional(),
				generateSeats: z.boolean().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const seatMapId = randomUUID();
			const rows = input.rows ?? 0;
			const cols = input.cols ?? 0;

			const created = await ctx.db.transaction(async (tx) => {
				const [sm] = await tx
					.insert(seatMaps)
					.values({
						id: seatMapId,
						eventId: input.eventId,
						name: input.name,
						layoutType: input.layoutType as LayoutType,
						rows,
						cols,
						totalSeats: rows * cols,
						zones: input.zones as SeatZone[] ?? [],
						layoutConfig: input.layoutConfig ?? null
					} satisfies NewSeatMap)
					.returning();

				const createdSeats: (typeof seats.$inferSelect)[] = [];
				if (input.generateSeats && rows > 0 && cols > 0) {
					const seatInserts: NewSeat[] = [];
					for (let r = 1; r <= rows; r++) {
						for (let c = 1; c <= cols; c++) {
							const rowNo = String.fromCharCode(64 + r < 65 ? r : 64 + r > 90 ? r : 64 + r) || String(r);
							const seatInsert: NewSeat = {
								id: randomUUID(),
								seatMapId,
								eventId: input.eventId,
								rowNo: String(r),
								colNo: String(c),
								seatNo: `${rowNo}排${c}座`,
								zoneId: null,
								category: 'standard',
								status: 'available',
								x: c,
								y: r
							};

							if (input.zones) {
								for (const z of input.zones) {
									if (
										z.rowRange &&
										r >= z.rowRange[0] &&
										r <= z.rowRange[1] &&
										(!z.colRange || (c >= z.colRange[0] && c <= z.colRange[1]))
									) {
										seatInsert.zoneId = z.id;
										break;
									}
								}
							}

							seatInserts.push(seatInsert);
						}
					}

					if (seatInserts.length > 0) {
						await tx.insert(seats).values(seatInserts);
					}
				}

				await tx.insert(statusTransitions).values({
					id: randomUUID(),
					eventId: input.eventId,
					entityType: 'seat' as any,
					entityId: seatMapId,
					fromStatus: null,
					toStatus: 'created',
					transitionType: 'seat_map_created',
					operatorId: ctx.user.id,
					triggerSource: 'operator',
					remark: `创建座位图: ${input.name} (${rows}x${cols} = ${rows * cols} 座)`
				});

				return sm;
			});

			return created;
		}),

	updateSeat: operatorProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.string().optional(),
				category: z.string().optional(),
				zoneId: z.string().optional(),
				ticketTypeId: z.string().optional(),
				seatNo: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			const original = await ctx.db.query.seats.findFirst({ where: eq(seats.id, id) });
			if (!original) throw new Error('座位不存在');

			const [updated] = await ctx.db.transaction(async (tx) => {
				const [u] = await tx
					.update(seats)
					.set({ ...data, updatedAt: new Date() })
					.where(eq(seats.id, id))
					.returning();

				if (data.status && original.status !== data.status) {
					await tx.insert(statusTransitions).values({
						id: randomUUID(),
						eventId: original.eventId,
						entityType: 'seat' as any,
						entityId: id,
						fromStatus: original.status,
						toStatus: data.status,
						transitionType: 'seat_status_change',
						operatorId: ctx.user.id,
						triggerSource: 'operator',
						remark: `座位 ${original.seatNo} 状态: ${original.status} → ${data.status}`
					});
				}

				return [u];
			});
			return updated;
		}),

	batchUpdateSeats: operatorProcedure
		.input(
			z.object({
				seatIds: z.array(z.string()).min(1).max(500),
				status: z.string().optional(),
				category: z.string().optional(),
				zoneId: z.string().optional(),
				ticketTypeId: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { seatIds, ...data } = input;
			const [updated] = await ctx.db
				.update(seats)
				.set({ ...data, updatedAt: new Date() })
				.where(inArray(seats.id, seatIds))
				.returning();
			return updated;
		}),

	deleteSeatMap: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			await ctx.db.transaction(async (tx) => {
				await tx.delete(seats).where(eq(seats.seatMapId, input.id));
				await tx.delete(seatMaps).where(eq(seatMaps.id, input.id));
			});
			return { success: true };
		})
});
