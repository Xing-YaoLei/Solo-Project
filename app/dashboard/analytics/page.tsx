import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, getAccessibleStoreIds } from "@/lib/permissions";
import { subDays } from "date-fns";

import FlowDistribution from "@/components/charts/FlowDistribution";
import LevelFunnel from "@/components/charts/LevelFunnel";
import RedemptionRanking from "@/components/charts/RedemptionRanking";
import RefundTrend from "@/components/charts/RefundTrend";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  type StoreSimple = { id: string; name: string; code: string; address: string | null; createdAt: Date };
  const allStores: StoreSimple[] = await prisma.store.findMany({ orderBy: { name: "asc" } });
  const accessibleStoreIds = getAccessibleStoreIds(user, allStores.map((s: StoreSimple) => s.id));
  const isManager = user.role === ROLES.MANAGER;

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sixtyDaysAgo = subDays(now, 60);

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

  const flowDistData = flowBuckets.map((b) => {
    const deposits = flows.filter(
      (f) => f.type === "deposit" && f.amount.toNumber() >= b.min && f.amount.toNumber() < b.max
    ).length;
    const consumes = flows.filter(
      (f) => f.type === "consume" && Math.abs(f.amount.toNumber()) >= b.min && Math.abs(f.amount.toNumber()) < b.max
    ).length;
    return { name: b.name, 充值: deposits, 消费: consumes };
  });

  const levelChanges = await prisma.memberLevelLog.groupBy({
    by: ["toLevel"],
    where: {
      changedAt: { gte: sixtyDaysAgo },
      member: { storeId: { in: accessibleStoreIds } },
    },
    _count: true,
  });

  const levelOrder = ["钻石", "金卡", "银卡", "普通"];
  const levelFunnelData = levelOrder.map((level) => {
    const found = levelChanges.find((l) => l.toLevel === level);
    return { name: level, value: found?._count || 0 };
  });

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

  const redemptionData = topProducts
    .filter((p) => p.productName)
    .map((p) => ({
      name: p.productName!,
      核销次数: p._count.productName,
      核销金额: Number(p._sum.value || 0),
    }));

  const refundReasons = await prisma.refund.groupBy({
    by: ["reason"],
    where: {
      refundedAt: { gte: sixtyDaysAgo },
      member: { storeId: { in: accessibleStoreIds } },
    },
    _count: true,
    orderBy: { _count: { reason: "desc" } },
  });

  const days = Array.from({ length: 60 }, (_, i) => subDays(now, 59 - i));
  const refundTrendData = await Promise.all(
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 gradient-text">数据分析中心</h1>
          <p className="text-sm" style={{ color: "#8B8378" }}>
            {isManager ? "全品牌多维度经营数据分析" : `门店数据分析 · 实时更新于 ${now.toLocaleTimeString("zh-CN")}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: "rgba(139,111,71,0.1)", color: "#C9A961" }}>
            近30天 · 近60天
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="账户流水分布" subtitle="近30天按金额区间统计">
          <FlowDistribution data={flowDistData} />
        </ChartCard>

        <ChartCard title="等级变化漏斗" subtitle="近60天等级变更统计">
          <LevelFunnel data={levelFunnelData} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="核销记录排行" subtitle="近30天商品 Top 10">
          <RedemptionRanking data={redemptionData} />
        </ChartCard>

        <ChartCard title="退款原因变化" subtitle="近60天每日分布趋势">
          <RefundTrend data={refundTrendData} reasons={refundReasons.map((r) => r.reason)} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 card-glow" style={{ backgroundColor: "#1A1613" }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold" style={{ color: "#E8E0D5" }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: "#8B8378" }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
