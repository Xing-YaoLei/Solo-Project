"use client";

import Sidebar from "./Sidebar";
import { Bell, Settings, User } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-[240px]">
        <header className="h-16 fixed top-0 right-0 left-[240px] z-40 bg-dark-900/60 backdrop-blur-xl border-b border-white/5">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-mono text-lg font-semibold text-white">
                景区运营数据中心
              </h1>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                实时
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-400">
                {new Date().toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </div>
              <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <Bell size={20} />
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <Settings size={20} />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="pt-16 min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
