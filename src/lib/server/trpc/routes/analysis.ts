import { z } from 'zod';
import { router, protectedProcedure, analystProcedure } from '../t';
import { db } from '$db';
import { workOrders, users, vehicles, shortageOrders } from '$db/schema';
import { and, eq, gte, lte, inArray, sql, desc, type SQL } from 'drizzle-orm';

export const analysisRouter = router({
  getDashboardStats: protectedProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayOrders, pendingShortages, monthStats, processingTime] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(workOrders)
        .where(gte(workOrders.createdAt, today))
        .limit(1),
      db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(shortageOrders)
        .where(eq(shortageOrders.status, 'pending'))
        .limit(1),
      db
        .select({
          total: sql<number>`count(*)`.as('total'),
          rework: sql<number>`sum(case when ${workOrders.isRework} then 1 else 0 end)`.as('rework')
        })
        .from(workOrders)
        .where(gte(workOrders.createdAt, monthStart))
        .limit(1),
      db
        .select({
          avgTime: sql<number>`avg(EXTRACT(EPOCH FROM (${workOrders.completedAt} - ${workOrders.createdAt})) / 3600)`.as('avgTime')
        })
        .from(workOrders)
        .where(and(eq(workOrders.status, 'completed'), gte(workOrders.createdAt, monthStart)))
        .limit(1)
    ]);

    const total = Number(monthStats[0]?.total || 0);
    const rework = Number(monthStats[0]?.rework || 0);
    const reworkRate = total > 0 ? rework / total : 0;

    return {
      todayWorkOrders: Number(todayOrders[0]?.count || 0),
      pendingShortages: Number(pendingShortages[0]?.count || 0),
      monthlyReworkRate: Math.round(reworkRate * 10000) / 100,
      avgProcessingTime: Math.round(Number(processingTime[0]?.avgTime || 0) * 10) / 10
    };
  }),

  getReworkAnalysis: analystProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        regions: z.array(z.string()).optional(),
        assignees: z.array(z.string()).optional()
      })
    )
    .query(async ({ input }) => {
      const where: (SQL | undefined)[] = [];
      if (input.dateFrom) where.push(gte(workOrders.createdAt, input.dateFrom));
      if (input.dateTo) where.push(lte(workOrders.createdAt, input.dateTo));
      if (input.regions && input.regions.length > 0) {
        where.push(inArray(workOrders.region, input.regions));
      }
      if (input.assignees && input.assignees.length > 0) {
        where.push(inArray(workOrders.createdBy, input.assignees));
      }

      return await db.transaction(async (tx) => {
        const [overall] = await tx
          .select({
            total: sql<number>`count(*)`.as('total'),
            reworkCount: sql<number>`sum(case when ${workOrders.isRework} then 1 else 0 end)`.as('reworkCount')
          })
          .from(workOrders)
          .where(and(...where))
          .limit(1);

        const byRegion = await tx
          .select({
            region: workOrders.region,
            total: sql<number>`count(*)`.as('total'),
            reworkCount: sql<number>`sum(case when ${workOrders.isRework} then 1 else 0 end)`.as('reworkCount')
          })
          .from(workOrders)
          .where(and(...where))
          .groupBy(workOrders.region)
          .orderBy(workOrders.region);

        const byTechnician = await tx
          .select({
            technicianId: workOrders.createdBy,
            total: sql<number>`count(*)`.as('total'),
            reworkCount: sql<number>`sum(case when ${workOrders.isRework} then 1 else 0 end)`.as('reworkCount')
          })
          .from(workOrders)
          .where(and(...where))
          .groupBy(workOrders.createdBy)
          .orderBy(desc(sql`rework_count`))
          .limit(10);

        const technicians = await tx.select().from(users);

        const byCause = await tx
          .select({
            cause: workOrders.reworkCause,
            count: sql<number>`count(*)`.as('count')
          })
          .from(workOrders)
          .where(and(...where, eq(workOrders.isRework, true), sql`${workOrders.reworkCause} IS NOT NULL`))
          .groupBy(workOrders.reworkCause)
          .orderBy(desc(sql`count`))
          .limit(10);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const trendWhere = [...where, gte(workOrders.createdAt, thirtyDaysAgo)];

        const trend = await tx
          .select({
            date: sql<string>`to_char(${workOrders.createdAt}, 'YYYY-MM-DD')`.as('date'),
            total: sql<number>`count(*)`.as('total'),
            reworkCount: sql<number>`sum(case when ${workOrders.isRework} then 1 else 0 end)`.as('reworkCount')
          })
          .from(workOrders)
          .where(and(...trendWhere))
          .groupBy(sql`date`)
          .orderBy(sql`date`);

        const total = Number(overall?.total || 0);
        const reworkCount = Number(overall?.reworkCount || 0);

        return {
          period: input.dateFrom ? `${input.dateFrom.toISOString().slice(0, 10)}` : '本月',
          totalWorkOrders: total,
          reworkCount,
          reworkRate: total > 0 ? Math.round((reworkCount / total) * 10000) / 100 : 0,
          byRegion: byRegion.map((r) => ({
            region: r.region || '未分配',
            reworkRate: r.total > 0 ? Math.round((Number(r.reworkCount) / Number(r.total)) * 10000) / 100 : 0,
            total: Number(r.total),
            reworkCount: Number(r.reworkCount)
          })),
          byTechnician: byTechnician.map((t) => {
            const tech = technicians.find((u) => u.id === t.technicianId);
            return {
              technician: tech?.name || '未知',
              technicianId: t.technicianId,
              reworkRate: t.total > 0 ? Math.round((Number(t.reworkCount) / Number(t.total)) * 10000) / 100 : 0,
              total: Number(t.total),
              reworkCount: Number(t.reworkCount)
            };
          }),
          byCause: byCause.map((c) => ({
            cause: c.cause || '未注明',
            count: Number(c.count),
            percentage: reworkCount > 0 ? Math.round((Number(c.count) / reworkCount) * 10000) / 100 : 0
          })),
          trend: trend.map((t) => ({
            date: t.date,
            reworkRate: t.total > 0 ? Math.round((Number(t.reworkCount) / Number(t.total)) * 10000) / 100 : 0
          }))
        };
      });
    }),

  queryWorkOrders: protectedProcedure
    .input(
      z.object({
        statuses: z.array(z.string()).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        regions: z.array(z.string()).optional(),
        assignees: z.array(z.string()).optional(),
        vehiclePlate: z.string().optional(),
        keywords: z.string().optional()
      })
    )
    .query(async ({ input }) => {
      const where: (SQL | undefined)[] = [];
      if (input.statuses && input.statuses.length > 0) {
        where.push(inArray(workOrders.status, input.statuses));
      }
      if (input.dateFrom) where.push(gte(workOrders.createdAt, input.dateFrom));
      if (input.dateTo) where.push(lte(workOrders.createdAt, input.dateTo));
      if (input.regions && input.regions.length > 0) {
        where.push(inArray(workOrders.region, input.regions));
      }
      if (input.assignees && input.assignees.length > 0) {
        where.push(inArray(workOrders.createdBy, input.assignees));
      }

      let orders = await db
        .select()
        .from(workOrders)
        .where(and(...where))
        .orderBy(desc(workOrders.createdAt))
        .limit(200);

      if (input.vehiclePlate || input.keywords) {
        const allVehicles = await db.select().from(vehicles);
        orders = orders.filter((o) => {
          const v = allVehicles.find((v) => v.id === o.vehicleId);
          if (input.vehiclePlate && v?.plateNumber.includes(input.vehiclePlate)) return true;
          if (input.keywords) {
            const kw = input.keywords.toLowerCase();
            if (v?.plateNumber.toLowerCase().includes(kw)) return true;
            if (v?.vin.toLowerCase().includes(kw)) return true;
            if (o.diagnosisResult?.toLowerCase().includes(kw)) return true;
          }
          return !input.vehiclePlate && !input.keywords;
        });
      }

      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId)).limit(1);
          const [creator] = await db.select().from(users).where(eq(users.id, order.createdBy)).limit(1);
          return { ...order, vehicle, creator };
        })
      );

      return ordersWithDetails;
    }),

  getUsers: protectedProcedure.query(async () => {
    return await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        region: users.region
      })
      .from(users)
      .orderBy(users.name);
  }),

  getRegions: protectedProcedure.query(async () => {
    const result = await db
      .selectDistinct({ region: users.region })
      .from(users)
      .where(sql`${users.region} IS NOT NULL`);
    return result.map((r) => r.region).filter(Boolean) as string[];
  })
});
