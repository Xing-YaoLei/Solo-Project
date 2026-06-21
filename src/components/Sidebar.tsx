"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/", label: "补贴趋势看板", icon: "📊" },
  { href: "/report", label: "综合报表", icon: "📈" },
  { href: "/damage", label: "物品损坏明细", icon: "📦" },
  { href: "/subsidy-rules", label: "补贴规则", icon: "⚖️" },
  { href: "/appeal", label: "申诉证据", icon: "📝" },
  { href: "/settlement", label: "结算明细", icon: "💰" },
  { href: "/compensation", label: "赔付记录", icon: "💵" },
  { href: "/sync", label: "数据同步", icon: "🔄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-lg">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">跑腿补贴看板</h1>
        <p className="text-sm text-gray-400 mt-1">路线补贴趋势分析</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
