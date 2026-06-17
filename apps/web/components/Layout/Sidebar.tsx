"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Clock,
  Camera,
  Users,
  Headphones,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "仪表盘",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "设计变更单",
    href: "/change-orders",
    icon: FileText,
  },
  {
    title: "材料延期",
    href: "/material-delays",
    icon: Clock,
  },
  {
    title: "验收照片",
    href: "/acceptance",
    icon: Camera,
  },
  {
    title: "工人签到",
    href: "/checkins",
    icon: Users,
  },
  {
    title: "售后工单",
    href: "/after-sales",
    icon: Headphones,
  },
  {
    title: "统计分析",
    href: "/statistics",
    icon: BarChart3,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r bg-card",
        className
      )}
    >
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">工程管理系统</h1>
        <p className="text-sm text-muted-foreground mt-1">设计变更分派</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">系统版本</p>
          <p className="text-sm font-medium">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
