"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Settings,
  Theater,
  FileText,
  Mountain,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/routes", label: "导览路线", icon: Map },
  { href: "/thresholds", label: "阈值配置", icon: Settings },
  { href: "/performances", label: "演出监测", icon: Theater },
  { href: "/reports", label: "复盘材料", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex h-16 items-center gap-2 border-b border-[hsl(var(--border))] px-6">
        <Mountain className="h-6 w-6 text-[hsl(var(--primary))]" />
        <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
          景区运营监测
        </span>
      </div>

      <div className="border-b border-[hsl(var(--border))] px-4 py-3">
        <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors">
          <span>示例景区</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[hsl(var(--border))] px-6 py-4">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          景区运营导览路线风险监测图
        </p>
      </div>
    </aside>
  );
}
