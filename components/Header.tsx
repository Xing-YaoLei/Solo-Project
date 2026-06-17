"use client";

import { Bell, RefreshCw, Calendar, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFilterStore } from "@/store/filter";
import { formatDate } from "@/lib/utils";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { dateRange } = useFilterStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-xl font-display font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-100 border border-border rounded-lg text-sm">
            <Calendar size={16} className="text-primary" />
            <span className="text-foreground/80 font-mono">
              {formatDate(dateRange.start)} ~ {formatDate(dateRange.end)}
            </span>
            <ChevronDown size={14} className="text-muted" />
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 bg-surface-100 border border-border rounded-lg text-sm hover:bg-surface-200 hover:border-primary/30 transition-all"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin text-primary" : "text-muted"}
            />
            <span>刷新</span>
          </button>

          <button className="relative p-2 bg-surface-100 border border-border rounded-lg hover:bg-surface-200 hover:border-primary/30 transition-all">
            <Bell size={18} className="text-muted" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger" />
          </button>
        </div>
      </div>
    </header>
  );
}
