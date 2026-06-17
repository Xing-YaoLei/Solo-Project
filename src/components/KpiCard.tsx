"use client";

import React from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  sub?: string;
  tone?: "default" | "primary" | "success" | "warning" | "shortage";
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, suffix, sub, tone = "default", icon }: KpiCardProps) {
  const toneMap: Record<string, string> = {
    default: "from-slate-50 to-white text-slate-900",
    primary: "from-primary-50 to-white text-primary-700",
    success: "from-success-light to-white text-success-dark",
    warning: "from-warning-light to-white text-warning-dark",
    shortage: "from-shortage-light to-white text-shortage-dark",
  };
  const chipTone: Record<string, string> = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-primary-100 text-primary-700",
    success: "bg-success-light text-success-dark",
    warning: "bg-warning-light text-warning-dark",
    shortage: "bg-shortage-light text-shortage-dark",
  };
  return (
    <div className={`card p-5 bg-gradient-to-br ${toneMap[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500 mb-1.5">{label}</div>
          <div className="text-2xl font-bold flex items-baseline gap-1">
            {value}
            {suffix && <span className="text-sm font-medium opacity-80">{suffix}</span>}
          </div>
          {sub && (
            <div className={`chip mt-2 ${chipTone[tone]}`}>{sub}</div>
          )}
        </div>
        {icon && <div className="text-3xl opacity-70">{icon}</div>}
      </div>
    </div>
  );
}
