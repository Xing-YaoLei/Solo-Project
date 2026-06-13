import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, getAccessibleStoreIds } from "@/lib/permissions";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { addDays, subDays } from "date-fns";
import { Prisma } from "@prisma/client";

import FlowDistribution from "@/components/charts/FlowDistribution";
import LevelFunnel from "@/components/charts/LevelFunnel";
import RedemptionRanking from "@/components/charts/RedemptionRanking";
import RefundTrend from "@/components/charts/RefundTrend";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  type StoreSimple = { id: string; name: string; code: string; address: string | null; createdAt: Date };
  const allStores: StoreSimple[] = await prisma.store.findMany({ orderBy: { name: "asc" } });
  const accessibleStoreIds = getAccessibleStoreIds(user, allStores.map((s: StoreSimple) => s.id));
  const isManager = user.role === ROLES.MANAGER;

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const totalStored = await prisma.storedValueAccount.aggregate({
    _sum: { balance: true },
    where: { isActive: true, member: { storeId: { in: accessibleStoreIds } } },
  });

  const totalMembers = await prisma.member.count({
    where: { storeId: { in: accessibleStoreIds } },
  });

  const totalDeposits30d = await prisma.accountFlow.aggregate({
    _sum: { amount: true },
    where: {
      type: "deposit",
      occurredAt: { gte: thirtyDaysAgo },
      account: { member: { storeId: { in: accessibleStoreIds } } },
    },
  });

  const totalConsumes30d = await prisma.accountFlow.aggregate({
    _sum: { amount: true },
    where: {
      type: "consume",
      occurredAt: { gte: thirtyDaysAgo },
      account: { member: { storeId: { in: accessibleStoreIds } } },
    },
  });

  const expiring7d = await prisma.benefit.count({
    where: {
      status: "active",
      expireAt: { lte: addDays(now, 7), gte: now },
      member: { storeId: { in: accessibleStoreIds } },
    },
  });

  const expiringSoon = await prisma.storedValueAccount.count({
    where: {
      isActive: true,
      balance: { gt: 0 },
      expireAt: { lte: addDays(now, 30), gte: now },
      member: { storeId: { in: accessibleStoreIds } },
    },
  });

  const activeMembers = await prisma.member.count({
    where: {
      storeId: { in: accessibleStoreIds },
      transactions: { some: { transactedAt: { gte: thirtyDaysAgo } } },
    },
  });

  const activeRate = totalMembers > 0 ? activeMembers / totalMembers : 0;

  const levelCounts = await prisma.member.groupBy({
    by: ["level"],
    where: { storeId: { in: accessibleStoreIds } },
    _count: true,
  });

  const levelOrder = ["钻石", "金卡", "银卡", "普通"];
  const levelData = levelOrder.map((level) => {
    const found = levelCounts.find((l) => l.level === level);
    return { name: level, value: found?._count || 0 };
  });

  const flowBuckets = [
    { name: "< ¥50", min: 0, max: 50 },
    { name: "¥50-200", min: 50, max: 200 },
    { name: "¥200-500", min: 200, max: 500 },
    { name: "¥500-1000", min: 500, max: 1000 },
    { name: "> ¥1000", min: 1000, max: Infinity },
  ];

  type FlowInfo = { amount: { toNumber: () => number }; type: string; occurredAt: Date };
  const flows: FlowInfo[] = await prisma.accountFlow.findMany({
    where: {
      occurredAt: { gte: thirtyDaysAgo },
      account: { member: { storeId: { in: accessibleStoreIds } } },
    },
    select: { amount: true, type: true, occurredAt: true },
  });

  const flowDistData = flowBuckets.map((b) => {
    const deposits = flows.filter(
      (f: FlowInfo) => f.type === "deposit" && f.amount.toNumber() >= b.min && f.amount.toNumber() < b.max
    ).length;
    const consumes = flows.filter(
      (f: FlowInfo) => f.type === "consume" && Math.abs(f.amount.toNumber()) >= b.min && Math.abs(f.amount.toNumber()) < b.max
    ).length;
    return { name: b.name, 充值: deposits, 消费: consumes };
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
      refundedAt: { gte: subDays(now, 60) },
      member: { storeId: { in: accessibleStoreIds } },
    },
    _count: true,
    orderBy: { _count: { reason: "desc" } },
  });

  const days = Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i));
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

  const storeStats = isManager
    ? await Promise.all(
        allStores.map(async (store: StoreSimple) => {
          const stored = await prisma.storedValueAccount.aggregate({
            _sum: { balance: true },
            where: { member: { storeId: store.id }, isActive: true },
          });
          const members = await prisma.member.count({ where: { storeId: store.id } });
          const active = await prisma.member.count({
            where: {
              storeId: store.id,
              transactions: { some: { transactedAt: { gte: thirtyDaysAgo } } },
            },
          });
          const renewals = await prisma.accountFlow.count({
            where: {
              type: "deposit",
              occurredAt: { gte: thirtyDaysAgo },
              account: { member: { storeId: store.id } },
            },
          });
          return {
            id: store.id,
            name: store.name,
            totalStored: Number(stored._sum.balance || 0),
            members,
            activeRate: members > 0 ? active / members : 0,
            renewals,
          };
        })
      )
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 gradient-text">储值风险监测总览</h1>
          <p className="text-sm" style={{ color: "#8B8378" }}>
            {isManager ? "全品牌会员储值风险与经营健康度" : `门店数据 · 实时更新于 ${now.toLocaleTimeString("zh-CN")}`}
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl text-xs" style={{ backgroundColor: "rgba(74,139,92,0.1)", color: "#4A8B5C" }}>
          ● 系统运行正常
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="储值总余额" value={formatCurrency(Number(totalStored._sum.balance || 0))} icon="wallet" trend="+12.5%" trendUp />
        <StatCard label="会员总数" value={formatNumber(totalMembers)} icon="users" trend={`活跃率 ${formatPercent(activeRate)}`} trendUp={activeRate > 0.4} />
        <StatCard label="30日净储值流入" value={formatCurrency(Number(totalDeposits30d._sum.amount || 0) + Number(totalConsumes30d._sum.amount || 0))} icon="flow" trend="充值 - 消费" trendNeutral />
        <StatCard label="权益/储值即将过期" value={`${expiringSoon} / ${expiring7d}`} icon="alert" trend="30天 / 7天内" trendUp={false} danger />
      </div>

      {isManager && (
        <div className="rounded-2xl p-6 card-glow" style={{ backgroundColor: "#1A1613" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl font-semibold" style={{ color: "#E8E0D5" }}>门店对比</h2>
            <span className="text-xs" style={{ color: "#8B8378" }}>近30天</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs" style={{ color: "#8B8378", borderBottom: "1px solid #2D2722" }}>
                  <th className="text-left py-3 px-4 font-medium">门店</th>
                  <th className="text-right py-3 px-4 font-medium">储值余额</th>
                  <th className="text-right py-3 px-4 font-medium">会员数</th>
                  <th className="text-right py-3 px-4 font-medium">活跃率</th>
                  <th className="text-right py-3 px-4 font-medium">续费笔数</th>
                </tr>
              </thead>
              <tbody>
                {storeStats.map((s, i) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-white/5" style={{ borderColor: "#2D2722" }}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono" style={{ backgroundColor: "rgba(139,111,71,0.15)", color: "#C9A961" }}>
                          {i + 1}
                        </div>
                        <span className="text-sm" style={{ color: "#E8E0D5" }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3.5 px-4 font-mono text-sm" style={{ color: "#E8E0D5" }}>{formatCurrency(s.totalStored)}</td>
                    <td className="text-right py-3.5 px-4 font-mono text-sm" style={{ color: "#E8E0D5" }}>{formatNumber(s.members)}</td>
                    <td className="text-right py-3.5 px-4">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#2D2722" }}>
                          <div className="h-full rounded-full" style={{ width: `${s.activeRate * 100}%`, background: "linear-gradient(90deg,#8B6F47,#C9A961)" }} />
                        </div>
                        <span className="font-mono text-xs" style={{ color: "#C9A961" }}>{formatPercent(s.activeRate, 0)}</span>
                      </div>
                    </td>
                    <td className="text-right py-3.5 px-4 font-mono text-sm" style={{ color: "#4A8B5C" }}>{s.renewals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="账户流水分布" subtitle="近30天按金额区间">
          <FlowDistribution data={flowDistData} />
        </ChartCard>

        <ChartCard title="会员等级分布" subtitle="当前等级结构">
          <LevelFunnel data={levelData} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="核销记录排行" subtitle="近30天商品 Top 10">
          <RedemptionRanking data={redemptionData} />
        </ChartCard>

        <ChartCard title="退款原因变化趋势" subtitle="近30天每日分布">
          <RefundTrend data={refundTrendData} reasons={refundReasons.map((r) => r.reason)} />
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendUp,
  trendNeutral,
  danger,
}: {
  label: string;
  value: string;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  trendNeutral?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl p-5 card-glow relative overflow-hidden group transition-all hover:-translate-y-0.5" style={{ backgroundColor: "#1A1613" }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: danger ? "#B84A4A" : "#C9A961" }} />
      <div className="relative flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: danger ? "rgba(184,74,74,0.15)" : "rgba(139,111,71,0.15)" }}>
          <StatIcon name={icon} color={danger ? "#B84A4A" : "#C9A961"} />
        </div>
        {trend && (
          <span
            className="text-xs px-2 py-1 rounded-lg font-medium"
            style={{
              backgroundColor: trendNeutral ? "rgba(139,131,120,0.1)" : trendUp ? "rgba(74,139,92,0.1)" : "rgba(184,74,74,0.1)",
              color: trendNeutral ? "#8B8378" : trendUp ? "#4A8B5C" : "#B84A4A",
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-sm mb-1" style={{ color: "#8B8378" }}>{label}</div>
        <div className="font-mono text-2xl font-semibold" style={{ color: "#E8E0D5" }}>{value}</div>
      </div>
    </div>
  );
}

function StatIcon({ name, color }: { name: string; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "w-5 h-5" };
  switch (name) {
    case "wallet":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    case "users":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "flow":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    default:
      return null;
  }
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
