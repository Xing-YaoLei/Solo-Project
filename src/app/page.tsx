"use client";

import KpiCards from "@/components/KpiCards";
import EntryTrendChart from "@/components/EntryTrendChart";
import AlertPanel from "@/components/AlertPanel";
import { useDashboardStore } from "@/store/dashboard";
import { Shield, User } from "lucide-react";

export default function HomePage() {
  const { kpiData, alerts, currentUserRole } = useDashboardStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-900">总览看板</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentUserRole === "ADMIN" ? "全项目材料进场数据总览" : "您负责范围内的材料进场数据"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {currentUserRole === "ADMIN" ? (
            <Shield size={14} className="text-amber-500" />
          ) : (
            <User size={14} className="text-slate-500" />
          )}
          <span>{currentUserRole === "ADMIN" ? "管理层视角" : "一线人员视角"}</span>
        </div>
      </div>

      <KpiCards data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EntryTrendChart />
        </div>
        <div>
          <AlertPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
