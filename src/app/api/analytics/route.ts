import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, buildWhereClause } from "@/lib/auth";
import {
  getInventoryDistribution,
  getFunnelStages,
  getSupplierRankings,
  getRequisitionTrends,
  getEntryTrend,
  getKpiData,
  getAlerts,
} from "@/lib/mock-data";
import { calculateKpiData } from "@/lib/data-processor";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const useMock = searchParams.get("mock") === "true";
    const days = parseInt(searchParams.get("days") || "30");

    if (useMock) {
      switch (type) {
        case "inventory":
          return NextResponse.json(getInventoryDistribution());
        case "funnel":
          return NextResponse.json(getFunnelStages());
        case "suppliers":
          return NextResponse.json(getSupplierRankings());
        case "requisitions":
          return NextResponse.json(getRequisitionTrends());
        case "trend":
          return NextResponse.json(getEntryTrend(days));
        case "kpi":
          return NextResponse.json(getKpiData());
        case "alerts":
          return NextResponse.json(getAlerts());
        default:
          return NextResponse.json(
            { error: "Invalid type parameter" },
            { status: 400 }
          );
      }
    }

    const user = getCurrentUser();
    const where = buildWhereClause(user);

    switch (type) {
      case "inventory": {
        const inStockEntries = await prisma.materialEntry.findMany({
          where: { ...where, status: "IN_STOCK" },
        });

        const filteredEntries =
          user.role === "STAFF"
            ? inStockEntries.filter((e) => {
                const batch = (e as unknown as { batch?: { projectId?: string } })
                  .batch;
                return (
                  batch?.projectId &&
                  user.projectIds.includes(batch.projectId)
                );
              })
            : inStockEntries;

        const total = filteredEntries.reduce((s, e) => s + e.quantity, 0);
        const byCategory: Record<string, number> = {};

        filteredEntries.forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.quantity;
        });

        const result = Object.entries(byCategory).map(
          ([category, quantity]) => ({
            category,
            quantity,
            percentage: Math.round((quantity / total) * 1000) / 10,
          })
        );

        return NextResponse.json(result);
      }

      case "funnel": {
        const entries = await prisma.materialEntry.findMany({
          where,
          include: { batch: { include: { project: true } } },
        });

        const filteredEntries =
          user.role === "STAFF"
            ? entries.filter((e) => {
                const projectId = e.batch?.projectId;
                return projectId && user.projectIds.includes(projectId);
              })
            : entries;

        const total = filteredEntries.length;
        const arrived = filteredEntries.filter(
          (e) =>
            e.status === "ARRIVED" ||
            e.status === "IN_STOCK" ||
            e.status === "RECLAIMED"
        ).length;
        const inStock = filteredEntries.filter(
          (e) => e.status === "IN_STOCK" || e.status === "RECLAIMED"
        ).length;
        const reclaimed = filteredEntries.filter(
          (e) => e.status === "RECLAIMED"
        ).length;
        const now = new Date();
        const warningDate = new Date(now);
        warningDate.setMonth(warningDate.getMonth() + 3);
        const expiring = filteredEntries.filter(
          (e) =>
            e.expiryDate && new Date(e.expiryDate) < warningDate
        ).length;

        return NextResponse.json([
          { stage: "进场登记", count: total, conversionRate: 100 },
          {
            stage: "在库管理",
            count: arrived,
            conversionRate: total > 0 ? Math.round((arrived / total) * 100) : 0,
          },
          {
            stage: "已领用",
            count: inStock,
            conversionRate: total > 0 ? Math.round((inStock / total) * 100) : 0,
          },
          {
            stage: "效期预警",
            count: reclaimed,
            conversionRate: total > 0 ? Math.round((reclaimed / total) * 100) : 0,
          },
          {
            stage: "过期处理",
            count: expiring,
            conversionRate: total > 0 ? Math.round((expiring / total) * 100) : 0,
          },
        ]);
      }

      case "suppliers": {
        const suppliers = await prisma.supplier.findMany({
          include: { materialEntries: true },
        });

        const result = suppliers.map((s) => {
          const entries = s.materialEntries;
          const totalDeliveries = entries.length;

          const onTimeCount = entries.filter(
            (e) => e.status !== "EXPIRED"
          ).length;
          const shortageCount = entries.filter(
            (e) => e.shortageNote !== null
          ).length;

          return {
            supplierId: s.id,
            supplierName: s.name,
            onTimeRate:
              totalDeliveries > 0 ? onTimeCount / totalDeliveries : 0,
            shortageRate:
              totalDeliveries > 0 ? shortageCount / totalDeliveries : 0,
            qualityScore: s.qualityScore,
            totalDeliveries,
          };
        });

        return NextResponse.json(
          result.sort((a, b) => b.onTimeRate - a.onTimeRate)
        );
      }

      case "requisitions": {
        const requisitions = await prisma.requisition.findMany({
          include: {
            materialEntry: true,
            project: true,
          },
          orderBy: { requestedAt: "asc" },
        });

        const filteredReqs =
          user.role === "STAFF"
            ? requisitions.filter((r) =>
                user.projectIds.includes(r.projectId)
              )
            : requisitions;

        const result = filteredReqs.map((r) => ({
          date: r.requestedAt.toISOString().split("T")[0],
          category: r.materialEntry?.category || "其他",
          quantity: r.quantity,
          projectName: r.project?.name,
        }));

        return NextResponse.json(result);
      }

      case "trend": {
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);

        const entries = await prisma.materialEntry.findMany({
          where: {
            ...where,
            entryDate: { gte: startDate },
          },
          include: { batch: { include: { project: true } } },
        });

        const filteredEntries =
          user.role === "STAFF"
            ? entries.filter((e) => {
                const projectId = e.batch?.projectId;
                return projectId && user.projectIds.includes(projectId);
              })
            : entries;

        const byDate: Record<
          string,
          { count: number; quantity: number }
        > = {};

        filteredEntries.forEach((e) => {
          const date = e.entryDate.toISOString().split("T")[0];
          if (!byDate[date]) byDate[date] = { count: 0, quantity: 0 };
          byDate[date].count++;
          byDate[date].quantity += e.quantity;
        });

        const result: { date: string; count: number; quantity: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateKey = d.toISOString().split("T")[0];
          const displayDate = `${d.getMonth() + 1}/${d.getDate()}`;
          result.push({
            date: displayDate,
            count: byDate[dateKey]?.count || 0,
            quantity: byDate[dateKey]?.quantity || 0,
          });
        }

        return NextResponse.json(result);
      }

      case "kpi": {
        const projectFilter =
          user.role === "STAFF" ? undefined : undefined;
        const kpi = await calculateKpiData(projectFilter);
        return NextResponse.json(kpi);
      }

      case "alerts": {
        const alerts: {
          id: string;
          type: "SHORTAGE" | "EXPIRY_WARNING" | "OVERDUE";
          message: string;
          batchNo: string;
          timestamp: string;
        }[] = [];

        const batches = await prisma.batch.findMany({
          where: { status: "SHORTAGE" },
          include: { project: true },
        });

        const filteredBatches =
          user.role === "STAFF"
            ? batches.filter((b) =>
                user.projectIds.includes(b.projectId)
              )
            : batches;

        filteredBatches.forEach((b) => {
          alerts.push({
            id: `alert-s-${b.id}`,
            type: "SHORTAGE",
            message: `批次 ${b.batchNo} 存在材料短缺`,
            batchNo: b.batchNo,
            timestamp: b.createdAt.toISOString().split("T")[0],
          });
        });

        const expiryEntries = await prisma.materialEntry.findMany({
          where: {
            expiryDate: { not: null },
          },
          include: { batch: { include: { project: true } } },
        });

        const now = new Date();
        const warningDate = new Date(now);
        warningDate.setMonth(warningDate.getMonth() + 2);

        const filteredExpiry =
          user.role === "STAFF"
            ? expiryEntries.filter((e) => {
                const projectId = e.batch?.projectId;
                return projectId && user.projectIds.includes(projectId);
              })
            : expiryEntries;

        filteredExpiry
          .filter((e) => e.expiryDate && new Date(e.expiryDate) < warningDate)
          .forEach((e) => {
            alerts.push({
              id: `alert-e-${e.id}`,
              type: "EXPIRY_WARNING",
              message: `${e.materialName} 即将过期 (${e.expiryDate?.toISOString().split("T")[0]})`,
              batchNo: "",
              timestamp: e.entryDate.toISOString().split("T")[0],
            });
          });

        const overdueDate = new Date(now);
        overdueDate.setMonth(overdueDate.getMonth() - 2);

        const overdueEntries = await prisma.materialEntry.findMany({
          where: {
            status: "ARRIVED",
            entryDate: { lt: overdueDate },
          },
          include: { batch: { include: { project: true } } },
        });

        const filteredOverdue =
          user.role === "STAFF"
            ? overdueEntries.filter((e) => {
                const projectId = e.batch?.projectId;
                return projectId && user.projectIds.includes(projectId);
              })
            : overdueEntries;

        filteredOverdue.forEach((e) => {
          alerts.push({
            id: `alert-o-${e.id}`,
            type: "OVERDUE",
            message: `${e.materialName} 超期未领用`,
            batchNo: "",
            timestamp: e.entryDate.toISOString().split("T")[0],
          });
        });

        return NextResponse.json(alerts.slice(0, 15));
      }

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("获取分析数据失败:", error);
    return NextResponse.json(
      { error: "获取分析数据失败" },
      { status: 500 }
    );
  }
}
