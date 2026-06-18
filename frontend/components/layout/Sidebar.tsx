"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  BarChart3,
  Bell,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";
import { useApp } from "@/lib/context/AppContext";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";

const menuItems = [
  {
    title: "工作台",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "任务列表",
    icon: ListTodo,
    href: "/tasks",
  },
  {
    title: "项目管理",
    icon: Building2,
    href: "/projects",
  },
  {
    title: "数据报表",
    icon: BarChart3,
    href: "/reports",
  },
  {
    title: "提醒中心",
    icon: Bell,
    href: "/reminders",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadRemindersCount } = useApp();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <Home className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">工地确认系统</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
              {item.href === "/reminders" && unreadRemindersCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
                  {unreadRemindersCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar} fallback={user.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
