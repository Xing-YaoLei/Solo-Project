"use client";

import Sidebar from "@/components/Sidebar";
import { useDashboardStore } from "@/store/dashboard";
import clsx from "clsx";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useDashboardStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main
        className={clsx(
          "transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        <div className="p-6 max-w-[1440px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
