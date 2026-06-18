"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  PackageSearch,
  Upload,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
} from "lucide-react";
import { useDashboardStore } from "@/store/dashboard";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "总览看板", icon: LayoutDashboard },
  { href: "/tracking", label: "进场追踪", icon: PackageSearch },
  { href: "/import", label: "数据导入", icon: Upload },
  { href: "/analytics", label: "数据分析", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, currentUserRole, setCurrentUserRole } = useDashboardStore();

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-screen bg-navy-900 text-white flex flex-col transition-all duration-300 z-50",
        sidebarCollapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-navy-700">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <PackageSearch size={18} className="text-navy-900" />
        </div>
        {!sidebarCollapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="font-display text-sm font-bold truncate">材料进场看板</h1>
            <p className="text-[10px] text-slate-500 truncate">家装工地管理系统</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center h-10 px-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-slate-500 hover:bg-navy-800 hover:text-slate-500"
              )}
            >
              <item.icon
                size={20}
                className={clsx(
                  "flex-shrink-0 transition-colors",
                  isActive ? "text-amber-400" : "text-slate-500 group-hover:text-white"
                )}
              />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <div className={clsx(
          "rounded-lg bg-navy-800 p-3 mb-3",
          sidebarCollapsed && "p-2"
        )}>
          {!sidebarCollapsed && (
            <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">角色切换</p>
          )}
          <button
            onClick={() => setCurrentUserRole(currentUserRole === "ADMIN" ? "STAFF" : "ADMIN")}
            className={clsx(
              "flex items-center w-full rounded-md transition-colors",
              sidebarCollapsed ? "justify-center p-2" : "gap-2 px-2 py-1.5"
            )}
          >
            {currentUserRole === "ADMIN" ? (
              <Shield size={16} className="text-amber-400 flex-shrink-0" />
            ) : (
              <User size={16} className="text-slate-500 flex-shrink-0" />
            )}
            {!sidebarCollapsed && (
              <span className="text-xs text-white">
                {currentUserRole === "ADMIN" ? "管理层" : "一线人员"}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex items-center justify-center w-full h-8 rounded-lg bg-navy-800 hover:bg-navy-700 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} className="text-slate-500" />
          ) : (
            <ChevronLeft size={16} className="text-slate-500" />
          )}
        </button>
      </div>
    </aside>
  );
}
