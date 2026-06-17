"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitCompare,
  Route,
  MapPin,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "趋势看板",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "数据对比",
    href: "/data-compare",
    icon: GitCompare,
  },
  {
    name: "路线总览",
    href: "/routes",
    icon: Route,
  },
  {
    name: "司机轨迹",
    href: "/driver-tracking",
    icon: MapPin,
  },
  {
    name: "装载清单",
    href: "/loading-list",
    icon: ClipboardList,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-surface-100 border-r border-border z-40 flex flex-col">
      <div className="p-5 border-b border-border">
        <h1 className="text-xl font-display font-bold text-gradient">
          维修派单看板
        </h1>
        <p className="text-xs text-muted mt-1">Long-Term Rental Ops</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/15 text-primary shadow-glow"
                  : "text-foreground/70 hover:bg-surface-200 hover:text-foreground"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-muted group-hover:text-foreground"
                )}
              />
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-slow" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-medium">
              OP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">运营管理员</p>
              <p className="text-xs text-muted truncate">op@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
