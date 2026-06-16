"use client";

import Link from "next/link";
import { Pill, Activity, ArrowRightLeft, Wallet, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const analysisCards = [
  {
    href: "/analytics/batch-expiry",
    label: "批号效期分布",
    description: "按近效期区间统计药品批次数量分布",
    icon: Pill,
    gradient: "from-orange-500 to-red-500",
    iconBg: "bg-gradient-to-br from-orange-500 to-red-600",
  },
  {
    href: "/analytics/member-funnel",
    label: "会员档案漏斗",
    description: "会员注册→建档→慢病标签→回访→复购转化分析",
    icon: Activity,
    gradient: "from-primary-500 to-primary-700",
    iconBg: "bg-gradient-to-br from-primary-500 to-primary-700",
  },
  {
    href: "/analytics/replenishment",
    label: "补货单排行",
    description: "Top10 高频补货药品排行分析",
    icon: ArrowRightLeft,
    gradient: "from-info-500 to-info-700",
    iconBg: "bg-gradient-to-br from-info-500 to-info-700",
  },
  {
    href: "/analytics/insurance",
    label: "医保流水变化",
    description: "近6个月医保结算金额与笔数变化趋势",
    icon: Wallet,
    gradient: "from-warning-500 to-warning-700",
    iconBg: "bg-gradient-to-br from-warning-500 to-warning-700",
  },
];

export default function AnalyticsIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
        <p className="text-sm text-slate-500 mt-1">运营分析与业务趋势洞察</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {analysisCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="card p-6 group hover:shadow-card-hover transition-all duration-300 animate-slide-up"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                    card.iconBg
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{card.label}</h3>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
