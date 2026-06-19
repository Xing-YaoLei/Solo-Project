"use client";

import { ReactNode } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { getLastUpdatedText } from "@/utils/format";
import { useState } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
  onRefresh?: () => void;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  lastUpdated,
  children,
  onRefresh,
  className = "",
  action,
}: ChartCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  return (
    <div
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-industrial-500/5 ${className}`}
    >
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 font-display">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {action}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-200"
              title="刷新数据"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
      <div className="px-6 py-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
        <Clock className="w-3.5 h-3.5" />
        <span>{getLastUpdatedText(lastUpdated)}</span>
      </div>
    </div>
  );
}
