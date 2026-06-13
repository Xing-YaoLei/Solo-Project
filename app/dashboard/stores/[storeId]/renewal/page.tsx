import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { canAccessStore, ROLES } from "@/lib/permissions";
import { formatCurrency, formatNumber, formatPercent, formatDate } from "@/lib/utils";
import { addDays, subDays } from "date-fns";

type MemberAccount = {
  id: string;
  memberId: string;
  balance: { toNumber: () => number } | number;
  expireAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

type MemberBenefit = {
  id: string;
  memberId: string;
  type: string;
  name: string;
  value: { toNumber: () => number } | number;
  expireAt: Date | null;
  status: string;
};

type MemberTransaction = {
  id: string;
  memberId: string | null;
  storeId: string;
  type: string;
  amount: { toNumber: () => number } | number;
  transactedAt: Date;
};

type MemberWithDetails = {
  id: string;
  memberNo: string;
  name: string;
  level: string;
  accounts: MemberAccount[];
  benefits: MemberBenefit[];
  transactions: MemberTransaction[];
};

export default async function RenewalDetailPage({
  params,
}: {
  params: { storeId: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canAccessStore(user, params.storeId)) {
    redirect("/dashboard");
  }

  const isManager = user.role === ROLES.MANAGER;

  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
  });

  if (!store) {
    redirect("/dashboard");
  }

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const thirtyDaysLater = addDays(now, 30);

  type FlowWithMember = { account: { memberId: string } };
  const renewedMemberIds = await prisma.accountFlow
    .findMany({
      where: {
        type: "deposit",
        occurredAt: { gte: thirtyDaysAgo },
        account: { member: { storeId: params.storeId } },
      },
      select: { account: { select: { memberId: true } } },
    })
    .then((flows: FlowWithMember[]) => new Set(flows.map((f: FlowWithMember) => f.account.memberId)));

  const members = await prisma.member.findMany({
    where: { storeId: params.storeId },
    include: {
      accounts: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
      benefits: {
        where: {
          status: "active",
          expireAt: { lte: thirtyDaysLater, gte: now },
        },
      },
      transactions: {
        orderBy: { transactedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { memberNo: "asc" },
  });

  type MemberRaw = (typeof members)[number];
  const shouldRenewMembers = members.filter((m: MemberRaw) => {
    const totalBalance = m.accounts.reduce(
      (sum: number, acc: MemberAccount) => sum + Number(acc.balance),
      0
    );
    const hasExpiringBenefit = m.benefits.length > 0;
    return totalBalance < 100 || hasExpiringBenefit;
  });

  const renewedIn30d = await prisma.accountFlow.count({
    where: {
      type: "deposit",
      occurredAt: { gte: thirtyDaysAgo },
      account: { member: { storeId: params.storeId } },
    },
  });

  const expiringBenefitsCount = await prisma.benefit.count({
    where: {
      status: "active",
      expireAt: { lte: thirtyDaysLater, gte: now },
      member: { storeId: params.storeId },
    },
  });

  const shouldRenewCount = shouldRenewMembers.length;
  const renewalRate =
    shouldRenewCount > 0
      ? Math.min(renewedIn30d / shouldRenewCount, 1)
      : 0;

  const membersWithStatus: (MemberWithDetails & {
    status: "pending" | "renewed" | "high_risk";
    totalBalance: number;
    latestExpireAt: Date | null;
    lastConsumeAt: Date | null;
  })[] = members.map((m: MemberRaw) => {
    const totalBalance = m.accounts.reduce(
      (sum: number, acc: MemberAccount) => sum + Number(acc.balance),
      0
    );
    const latestExpireAt =
      m.accounts.length > 0
        ? m.accounts
            .map((a: MemberAccount) => a.expireAt)
            .filter((d: Date | null): d is Date => d !== null && d !== undefined)
            .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0] || null
        : null;
    const lastConsumeAt =
      m.transactions.length > 0 ? m.transactions[0].transactedAt : null;

    const hasRenewed = renewedMemberIds.has(m.id);

    let status: "pending" | "renewed" | "high_risk";
    if (hasRenewed) {
      status = "renewed";
    } else if (totalBalance < 50 || m.benefits.length >= 2) {
      status = "high_risk";
    } else {
      status = "pending";
    }

    return {
      ...m,
      status,
      totalBalance,
      latestExpireAt,
      lastConsumeAt,
    };
  });

  const sortedMembers = [...membersWithStatus].sort((a, b) => {
    const statusOrder = { high_risk: 0, pending: 1, renewed: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 gradient-text">
            {store.name} · 续费率明细
          </h1>
          <p className="text-sm" style={{ color: "#8B8378" }}>
            {isManager
              ? `全部门店可查看 · 实时更新于 ${now.toLocaleTimeString("zh-CN")}`
              : `门店运营数据 · 实时更新于 ${now.toLocaleTimeString("zh-CN")}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard
          label="应续费人数"
          value={formatNumber(shouldRenewCount)}
          icon="users"
          color="#C9A961"
        />
        <SummaryCard
          label="近30天已续费"
          value={formatNumber(renewedIn30d)}
          icon="check"
          color="#4A8B5C"
        />
        <SummaryCard
          label="续费率"
          value={formatPercent(renewalRate)}
          icon="chart"
          color="#C9A961"
        />
        <SummaryCard
          label="即将过期权益"
          value={formatNumber(expiringBenefitsCount)}
          icon="alert"
          color="#B84A4A"
        />
      </div>

      <div className="rounded-2xl p-6 card-glow" style={{ backgroundColor: "#1A1613" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-xl font-semibold" style={{ color: "#E8E0D5" }}>
              会员续费跟进明细
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8B8378" }}>
              共 {formatNumber(sortedMembers.length)} 位会员，按风险等级排序
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="text-xs"
                style={{ color: "#8B8378", borderBottom: "1px solid #2D2722" }}
              >
                <th className="text-left py-3 px-4 font-medium">会员号</th>
                <th className="text-left py-3 px-4 font-medium">姓名</th>
                <th className="text-left py-3 px-4 font-medium">等级</th>
                <th className="text-right py-3 px-4 font-medium">储值余额</th>
                <th className="text-right py-3 px-4 font-medium">余额有效期</th>
                <th className="text-right py-3 px-4 font-medium">最近消费时间</th>
                <th className="text-center py-3 px-4 font-medium">状态</th>
                <th className="text-center py-3 px-4 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => (
                <tr
                  key={member.id}
                  className="border-b last:border-0 hover:bg-white/5 transition-colors"
                  style={{ borderColor: "#2D2722" }}
                >
                  <td
                    className="py-3.5 px-4 font-mono text-sm"
                    style={{ color: "#E8E0D5" }}
                  >
                    {member.memberNo}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm" style={{ color: "#E8E0D5" }}>
                      {member.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <LevelBadge level={member.level} />
                  </td>
                  <td
                    className="text-right py-3.5 px-4 font-mono text-sm"
                    style={{ color: member.totalBalance < 100 ? "#B84A4A" : "#E8E0D5" }}
                  >
                    {formatCurrency(member.totalBalance)}
                  </td>
                  <td
                    className="text-right py-3.5 px-4 text-sm"
                    style={{ color: "#8B8378" }}
                  >
                    {member.latestExpireAt ? formatDate(member.latestExpireAt) : "-"}
                  </td>
                  <td
                    className="text-right py-3.5 px-4 text-sm"
                    style={{ color: "#8B8378" }}
                  >
                    {member.lastConsumeAt ? formatDate(member.lastConsumeAt) : "-"}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "rgba(139,111,71,0.15)",
                          color: "#C9A961",
                        }}
                      >
                        联系跟进
                      </button>
                      {member.status !== "renewed" && (
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: "rgba(74,139,92,0.15)",
                            color: "#4A8B5C",
                          }}
                        >
                          登记续费
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedMembers.length === 0 && (
          <div className="py-16 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "rgba(139,131,120,0.1)" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="#8B8378"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-sm" style={{ color: "#8B8378" }}>
              暂无会员数据
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 card-glow relative overflow-hidden group transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "#1A1613" }}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}26` }}
        >
          <SummaryIcon name={icon} color={color} />
        </div>
      </div>
      <div className="relative">
        <div className="text-sm mb-1" style={{ color: "#8B8378" }}>
          {label}
        </div>
        <div className="font-mono text-2xl font-semibold" style={{ color: "#E8E0D5" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SummaryIcon({ name, color }: { name: string; color: string }) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "w-5 h-5",
  };
  switch (name) {
    case "users":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

function StatusBadge({ status }: { status: "pending" | "renewed" | "high_risk" }) {
  const config = {
    pending: {
      label: "待续费",
      bg: "rgba(139,111,71,0.15)",
      color: "#C9A961",
    },
    renewed: {
      label: "已续费",
      bg: "rgba(74,139,92,0.15)",
      color: "#4A8B5C",
    },
    high_risk: {
      label: "高风险",
      bg: "rgba(184,74,74,0.15)",
      color: "#B84A4A",
    },
  };

  const { label, bg, color } = config[status];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    钻石: { bg: "rgba(185,185,200,0.15)", color: "#B9B9C8" },
    金卡: { bg: "rgba(201,169,97,0.15)", color: "#C9A961" },
    银卡: { bg: "rgba(169,169,169,0.15)", color: "#A9A9A9" },
    普通: { bg: "rgba(139,131,120,0.15)", color: "#8B8378" },
  };

  const { bg, color } = config[level] || config["普通"];

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {level}
    </span>
  );
}
