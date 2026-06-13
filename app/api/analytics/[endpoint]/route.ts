import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAccessibleStoreIds } from "@/lib/permissions";
import { subDays } from "date-fns";

const VALID_ENDPOINTS = [
  "flow-distribution",
  "level-funnel",
  "redemption-ranking",
  "refund-trend",
  "renewal-rate",
];

export async function GET(
  request: Request,
  { params }: { params: { endpoint: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (!VALID_ENDPOINTS.includes(params.endpoint)) {
      return NextResponse.json({ error: "无效的端点" }, { status: 400 });
    }

    type StoreIdOnly = { id: string };
    const allStores: StoreIdOnly[] = await prisma.store.findMany({ select: { id: true } });
    const accessibleStoreIds = getAccessibleStoreIds(user, allStores.map((s: StoreIdOnly) => s.id));

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    switch (params.endpoint) {
      case "flow-distribution": {
        const flowBuckets = [
          { name: "< ¥50", min: 0, max: 50 },
          { name: "¥50-200", min: 50, max: 200 },
          { name: "¥200-500", min: 200, max: 500 },
          { name: "¥500-1000", min: 500, max: 1000 },
          { name: "> ¥1000", min: 1000, max: Infinity },
        ];

        const flows = await prisma.accountFlow.findMany({
          where: {
            occurredAt: { gte: thirtyDaysAgo },
            account: { member: { storeId: { in: accessibleStoreIds } } },
          },
          select: { amount: true, type: true, occurredAt: true },
        });

        const data = flowBuckets.map((b) => {
          const deposits = flows.filter(
            (f) => f.type === "deposit" && f.amount.toNumber() >= b.min && f.amount.toNumber() < b.max
          ).length;
          const consumes = flows.filter(
            (f) =>
              f.type === "consume" &&
              Math.abs(f.amount.toNumber()) >= b.min &&
              Math.abs(f.amount.toNumber()) < b.max
          ).length;
          return { name: b.name, 充值: deposits, 消费: consumes };
        });

        return NextResponse.json({ data });
      }

      case "level-funnel": {
        const levelCounts = await prisma.member.groupBy({
          by: ["level"],
          where: { storeId: { in: accessibleStoreIds } },
          _count: true,
        });

        const levelOrder = ["钻石", "金卡", "银卡", "普通"];
        const data = levelOrder.map((level) => {
          const found = levelCounts.find((l) => l.level === level);
          return { name: level, value: found?._count || 0 };
        });

        return NextResponse.json({ data });
      }

      case "redemption-ranking": {
        const topProducts = await prisma.redemption.groupBy({
          by: ["productName"],
          where: {
            storeId: { in: accessibleStoreIds },
            redeemedAt: { gte: thirtyDaysAgo },
            productName: { not: null },
          },
          _count: { productName: true },
          _sum: { value: true },
          orderBy: { _sum: { value: "desc" } },
          take: 10,
        });

        const data = topProducts
          .filter((p) => p.productName)
          .map((p) => ({
            name: p.productName!,
            核销次数: p._count.productName,
            核销金额: Number(p._sum.value || 0),
          }));

        return NextResponse.json({ data });
      }

      case "refund-trend": {
        const refundReasons = await prisma.refund.groupBy({
          by: ["reason"],
          where: {
            refundedAt: { gte: subDays(now, 60) },
            member: { storeId: { in: accessibleStoreIds } },
          },
          _count: true,
          orderBy: { _count: { reason: "desc" } },
        });

        const days = Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i));
        const data = await Promise.all(
          days.map(async (d) => {
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            const dayRefunds = await prisma.refund.groupBy({
              by: ["reason"],
              where: {
                refundedAt: { gte: start, lt: end },
                member: { storeId: { in: accessibleStoreIds } },
              },
              _count: true,
            });
            const result: Record<string, unknown> = {
              date: `${d.getMonth() + 1}/${d.getDate()}`,
            };
            for (const r of refundReasons) {
              result[r.reason] = dayRefunds.find((x) => x.reason === r.reason)?._count || 0;
            }
            return result;
          })
        );

        return NextResponse.json({ data, reasons: refundReasons.map((r) => r.reason) });
      }

      case "renewal-rate": {
        type StoreBasic = { id: string; name: string };
        const storesWithAccess: StoreBasic[] = await prisma.store.findMany({
          where: { id: { in: accessibleStoreIds } },
          select: { id: true, name: true },
        });

        const data = await Promise.all(
          storesWithAccess.map(async (store: StoreBasic) => {
            const totalMembers = await prisma.member.count({ where: { storeId: store.id } });
            const renewals = await prisma.accountFlow.count({
              where: {
                type: "deposit",
                occurredAt: { gte: thirtyDaysAgo },
                account: { member: { storeId: store.id } },
              },
            });
            const activeMembers = await prisma.member.count({
              where: {
                storeId: store.id,
                transactions: { some: { transactedAt: { gte: thirtyDaysAgo } } },
              },
            });
            return {
              storeId: store.id,
              storeName: store.name,
              totalMembers,
              renewals,
              activeMembers,
              renewalRate: totalMembers > 0 ? renewals / totalMembers : 0,
              activeRate: totalMembers > 0 ? activeMembers / totalMembers : 0,
            };
          })
        );

        return NextResponse.json({ data });
      }

      default:
        return NextResponse.json({ error: "无效的端点" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
