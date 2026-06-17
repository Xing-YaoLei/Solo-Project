"use client";

import { AlertTriangle, Clock, Package, ArrowRight } from "lucide-react";
import { MaterialDelay } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

interface MaterialDelayCardProps {
  delay: MaterialDelay;
  className?: string;
  onClick?: () => void;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function getDelaySeverity(days: number | null | undefined): "mild" | "moderate" | "severe" {
  if (!days || days <= 0) return "mild";
  if (days <= 3) return "mild";
  if (days <= 7) return "moderate";
  return "severe";
}

export function MaterialDelayCard({
  delay,
  className,
  onClick,
}: MaterialDelayCardProps) {
  const severity = getDelaySeverity(delay.delayDays);

  const severityStyles = {
    mild: "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20",
    moderate: "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20",
    severe: "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20",
  };

  const delayTextStyles = {
    mild: "text-amber-600 dark:text-amber-400",
    moderate: "text-orange-600 dark:text-orange-400",
    severe: "text-red-600 dark:text-red-400",
  };

  const delayBgStyles = {
    mild: "bg-amber-100 dark:bg-amber-900/30",
    moderate: "bg-orange-100 dark:bg-orange-900/30",
    severe: "bg-red-100 dark:bg-red-900/30",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-sm transition-all hover:shadow-md",
        severityStyles[severity],
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              delayBgStyles[severity]
            )}
          >
            <Package className={cn("h-5 w-5", delayTextStyles[severity])} />
          </div>
          <div>
            <h4 className="font-medium leading-tight">{delay.materialName}</h4>
            {delay.specification && (
              <p className="text-xs text-muted-foreground">
                {delay.specification}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={delay.status} type="materialDelay" />
      </div>

      {delay.delayDays !== null && delay.delayDays !== undefined && (
        <div
          className={cn(
            "mb-3 flex items-center gap-2 rounded-md px-3 py-2",
            delayBgStyles[severity]
          )}
        >
          <AlertTriangle className={cn("h-4 w-4", delayTextStyles[severity])} />
          <span className={cn("text-sm font-bold", delayTextStyles[severity])}>
            延期 {delay.delayDays} 天
          </span>
        </div>
      )}

      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          <span>原计划：{formatDate(delay.originalDate)}</span>
          {delay.estimatedDate && (
            <>
              <ArrowRight className="h-3 w-3" />
              <span>预计：{formatDate(delay.estimatedDate)}</span>
            </>
          )}
        </div>

        {delay.quantity !== null && delay.quantity !== undefined && (
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5" />
            <span>数量：{delay.quantity}</span>
          </div>
        )}
      </div>

      {delay.impact && (
        <div className="mt-3 border-t pt-3">
          <p className="text-xs font-medium text-foreground">影响</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {delay.impact}
          </p>
        </div>
      )}
    </div>
  );
}
