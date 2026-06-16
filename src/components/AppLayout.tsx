"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UsersRound,
  BarChart3,
  Database,
  Settings,
  LogOut,
  Pill,
  Activity,
  ArrowRightLeft,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "总览仪表盘",
    icon: LayoutDashboard,
    roles: ["admin", "manager"],
  },
  {
    href: "/follow-ups",
    label: "回访明细",
    icon: UsersRound,
  },
  {
    href: "/analytics",
    label: "数据分析",
    icon: BarChart3,
    roles: ["admin", "manager"],
  },
  {
    href: "/analytics/batch-expiry",
    label: "批号效期分布",
    icon: Pill,
    roles: ["admin", "manager"],
  },
  {
    href: "/analytics/member-funnel",
    label: "会员档案漏斗",
    icon: Activity,
    roles: ["admin", "manager"],
  },
  {
    href: "/analytics/replenishment",
    label: "补货单排行",
    icon: ArrowRightLeft,
    roles: ["admin", "manager"],
  },
  {
    href: "/analytics/insurance",
    label: "医保流水变化",
    icon: Wallet,
    roles: ["admin", "manager"],
  },
  {
    href: "/imports",
    label: "数据导入批次",
    icon: Database,
    roles: ["admin"],
  },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">慢病监测</div>
              <div className="text-xs text-slate-400">药店连锁系统</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "sidebar-link text-sm",
                  isActive && "active"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="px-3 py-2 mb-2">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-slate-400">
              {user?.role === "admin"
                ? "系统管理员"
                : user?.role === "manager"
                ? "管理层"
                : "一线人员"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sidebar-link text-sm text-red-300 hover:text-red-200 hover:bg-red-900/30"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6">
          <div className="flex-1">
            <nav className="text-sm text-slate-500">
              {pathname === "/dashboard" && "首页 / 总览仪表盘"}
              {pathname === "/follow-ups" && "首页 / 回访明细"}
              {pathname.startsWith("/analytics") &&
                `首页 / 数据分析 / ${
                  pathname.includes("batch-expiry")
                    ? "批号效期分布"
                    : pathname.includes("member-funnel")
                    ? "会员档案漏斗"
                    : pathname.includes("replenishment")
                    ? "补货单排行"
                    : pathname.includes("insurance")
                    ? "医保流水变化"
                    : "总览"
                }`}
              {pathname.startsWith("/imports") &&
                (pathname === "/imports"
                  ? "首页 / 数据导入批次"
                  : "首页 / 数据导入批次 / 详情")}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.storeName}</span>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
