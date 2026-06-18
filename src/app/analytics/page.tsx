"use client";

import InventoryDistributionChart from "@/components/InventoryDistributionChart";
import FunnelChart from "@/components/FunnelChart";
import SupplierRankingChart from "@/components/SupplierRankingChart";
import RequisitionTrendChart from "@/components/RequisitionTrendChart";
import { useDashboardStore } from "@/store/dashboard";
import { Shield, User } from "lucide-react";

export default function AnalyticsPage() {
  const { currentUserRole } = useDashboardStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-navy-900">数据分析</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            库存台账分布、批次效期漏斗、供应商排行、领用记录变化
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {currentUserRole === "ADMIN" ? (
            <Shield size={14} className="text-amber-500" />
          ) : (
            <User size={14} className="text-slate-500" />
          )}
          <span>{currentUserRole === "ADMIN" ? "全局分析" : "负责范围分析"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryDistributionChart />
        <FunnelChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupplierRankingChart />
        <RequisitionTrendChart />
      </div>
    </div>
  );
}
