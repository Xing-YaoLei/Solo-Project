import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLES, getAccessibleStoreIds } from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { addDays, differenceInDays, startOfDay } from "date-fns";
import BenefitsList from "./BenefitsList";

export const dynamic = "force-dynamic";

export default async function BenefitsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  type StoreSimple = { id: string; name: string; code: string; address: string | null; createdAt: Date };
  const allStores: StoreSimple[] = await prisma.store.findMany({ orderBy: { name: "asc" } });
  const accessibleStoreIds = getAccessibleStoreIds(user, allStores.map((s: StoreSimple) => s.id));
  const isManager = user.role === ROLES.MANAGER;

  const now = startOfDay(new Date());
  const in7Days = addDays(now, 7);
  const in30Days = addDays(now, 30);
  const in90Days = addDays(now, 90);

  const count7d = await prisma.benefit.count({
    where: {
      status: "active",
      expireAt: { lte: in7Days, gte: now },
      member: { storeId: { in: accessibleStoreIds } },
    },
  });

  const count30d = await prisma.benefit.count({
    where: {
      status: "active",
      expireAt: { lte: in30Days, gte: now },
      member: { storeId: { in: accessibleStoreIds } },
    },
  });

  const countExpired = await prisma.benefit.count({
    where: {
      status: "active",
      expireAt: { lt: now },
      member: { storeId: { in: accessibleStoreIds } },
    },
  });

  const countWithNotes = await prisma.benefit.count({
    where: {
      expireAt: { lte: in90Days },
      member: { storeId: { in: accessibleStoreIds } },
      memberNotes: { some: {} },
    },
  });

  const benefits = await prisma.benefit.findMany({
    where: {
      status: "active",
      expireAt: { lte: in90Days },
      member: { storeId: { in: accessibleStoreIds } },
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          memberNo: true,
          phone: true,
          level: true,
        },
      },
      memberNotes: {
        include: {
          staff: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ expireAt: "asc" }],
  });

  type BenefitRaw = (typeof benefits)[number];
  const enrichedBenefits = benefits.map((b: BenefitRaw) => {
    const expireAt = b.expireAt ? startOfDay(b.expireAt) : null;
    const daysLeft = expireAt ? differenceInDays(expireAt, now) : null;
    let status: "urgent" | "warning" | "expired" | "normal";
    if (daysLeft === null || daysLeft < 0) status = "expired";
    else if (daysLeft < 7) status = "urgent";
    else if (daysLeft < 30) status = "warning";
    else status = "normal";
    return {
      ...b,
      daysLeft,
      status,
    };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 gradient-text">权益过期管理</h1>
          <p className="text-sm" style={{ color: "#8B8378" }}>
            {isManager ? "全品牌即将过期权益监测" : `门店数据 · 实时更新于 ${new Date().toLocaleTimeString("zh-CN")}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="7天内过期" value={count7d.toString()} icon="urgent" danger />
        <StatCard label="30天内过期" value={count30d.toString()} icon="warning" warning />
        <StatCard label="已过期未核销" value={countExpired.toString()} icon="expired" />
        <StatCard label="已添加注释" value={countWithNotes.toString()} icon="note" success />
      </div>

      <div className="rounded-2xl p-6 card-glow" style={{ backgroundColor: "#1A1613" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: "#E8E0D5" }}>即将过期权益列表</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8B8378" }}>90天内过期 · 共 {enrichedBenefits.length} 条</p>
          </div>
        </div>

        <BenefitsList benefits={enrichedBenefits} formatCurrency={formatCurrency} formatDate={formatDate} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  danger,
  warning,
  success,
}: {
  label: string;
  value: string;
  icon: string;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
}) {
  const color = danger ? "#B84A4A" : warning ? "#C9A961" : success ? "#4A8B5C" : "#8B8378";
  const bgColor = danger ? "rgba(184,74,74,0.15)" : warning ? "rgba(201,169,97,0.15)" : success ? "rgba(74,139,92,0.15)" : "rgba(139,131,120,0.15)";

  return (
    <div className="rounded-2xl p-5 card-glow relative overflow-hidden group transition-all hover:-translate-y-0.5" style={{ backgroundColor: "#1A1613" }}>
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: color }} />
      <div className="relative flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <StatIcon name={icon} color={color} />
        </div>
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
    case "urgent":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "expired":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "note":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    default:
      return null;
  }
}
