"use client";

import { Calendar, Clock, Building2, AlertTriangle } from "lucide-react";
import { DesignChangeOrder, Project } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

interface ChangeOrderCardProps {
  order: DesignChangeOrder & { project?: Project };
  hasMaterialDelay?: boolean;
  materialDelayCount?: number;
  className?: string;
  onClick?: () => void;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function isDeadlineNear(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
}

function isOverdue(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  const now = new Date();
  return d.getTime() < now.getTime();
}

export function ChangeOrderCard({
  order,
  hasMaterialDelay = false,
  materialDelayCount = 0,
  className,
  onClick,
}: ChangeOrderCardProps) {
  const deadlineNear = isDeadlineNear(order.deadline);
  const overdue = isOverdue(order.deadline);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-muted-foreground">
          {order.orderNo}
        </span>
        <StatusBadge status={order.status} type="changeOrder" />
      </div>

      <h4 className="mb-2 font-medium leading-snug line-clamp-2">
        {order.title}
      </h4>

      {order.project && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          <span className="truncate">{order.project.name}</span>
        </div>
      )}

      {order.deadline && (
        <div
          className={cn(
            "mb-3 flex items-center gap-1.5 text-xs",
            overdue
              ? "text-destructive"
              : deadlineNear
              ? "text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3 w-3" />
          <span>截止：{formatDate(order.deadline)}</span>
          {overdue && <span className="font-medium">已逾期</span>}
          {deadlineNear && !overdue && <span className="font-medium">即将到期</span>}
        </div>
      )}

      {(hasMaterialDelay || materialDelayCount > 0) && (
        <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            材料延期
            {materialDelayCount > 0 && ` (${materialDelayCount}项)`}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        {order.designer ? (
          <span>设计师：{order.designer.name}</span>
        ) : (
          <span>未分配设计师</span>
        )}
        {order.impactOnCost !== null && order.impactOnCost !== undefined && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {order.impactOnCost > 0 ? "+" : ""}
              ¥{order.impactOnCost.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
