"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  ShoppingCart,
  Theater,
  Database,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "导览路线趋势", href: "/", icon: <LineChart size={20} /> },
  { label: "二消转化报表", href: "/secondary-consumption", icon: <ShoppingCart size={20} /> },
  { label: "演出管理", href: "/performances", icon: <Theater size={20} /> },
  { label: "数据同步监控", href: "/sync-monitor", icon: <Database size={20} /> },
  { label: "合同口径说明", href: "/contracts", icon: <FileText size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ width: 240 }}
      animate={{ width: collapsed ? 72 : 240 }}
      className="fixed left-0 top-0 h-screen bg-dark-900/80 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <MapPin size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-mono font-bold text-white text-sm">ScenicOS</span>
              <span className="text-xs text-slate-500">运营数据平台</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
