"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import clsx from "clsx";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: ReactNode;
  colorScheme?: "default" | "success" | "danger" | "warning" | "industrial";
  subtitle?: string;
  delay?: number;
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  icon,
  colorScheme = "default",
  subtitle,
  delay = 0,
}: KpiCardProps) {
  const colorClasses = {
    default: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    success: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    danger: "from-rose-500/20 to-rose-600/5 border-rose-500/20",
    warning: "from-amber-500/20 to-amber-600/5 border-amber-500/20",
    industrial: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  };

  const iconColorClasses = {
    default: "text-blue-400",
    success: "text-emerald-400",
    danger: "text-rose-400",
    warning: "text-amber-400",
    industrial: "text-industrial-400",
  };

  return (
    <div
      className={clsx(
        "glass-card rounded-2xl p-6 border bg-gradient-to-br transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
        colorClasses[colorScheme]
      )}
      style={{
        animation: `slideUp 0.6s ease-out ${delay}ms both`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={clsx(
              "p-3 rounded-xl bg-white/5",
              iconColorClasses[colorScheme]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-white font-display font-mono">
          {value}
        </span>
        {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-rose-400" />
          )}
          <span
            className={clsx(
              "text-sm font-medium",
              trend >= 0 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500">较上周</span>
        </div>
      )}
    </div>
  );
}
