"use client";

import {
  ChangeOrderStatus,
  MaterialDelayStatus,
  AcceptanceStatus,
  AfterSalesStatus,
} from "@/types";
import { cn } from "@/lib/utils";

export type StatusType =
  | "changeOrder"
  | "materialDelay"
  | "acceptance"
  | "afterSales";

type StatusMap = Record<string, { label: string; variant: string }>;

const changeOrderStatusMap: StatusMap = {
  [ChangeOrderStatus.DRAFT]: { label: "草稿", variant: "default" },
  [ChangeOrderStatus.PENDING_REVIEW]: { label: "待审核", variant: "warning" },
  [ChangeOrderStatus.DESIGNER_APPROVED]: {
    label: "设计师已批",
    variant: "info",
  },
  [ChangeOrderStatus.OWNER_APPROVED]: { label: "业主已批", variant: "info" },
  [ChangeOrderStatus.IN_PROGRESS]: { label: "进行中", variant: "primary" },
  [ChangeOrderStatus.PENDING_ACCEPTANCE]: {
    label: "待验收",
    variant: "warning",
  },
  [ChangeOrderStatus.ACCEPTED]: { label: "已验收", variant: "success" },
  [ChangeOrderStatus.REJECTED]: { label: "已拒绝", variant: "destructive" },
  [ChangeOrderStatus.CANCELLED]: { label: "已取消", variant: "muted" },
};

const materialDelayStatusMap: StatusMap = {
  [MaterialDelayStatus.REPORTED]: { label: "已上报", variant: "warning" },
  [MaterialDelayStatus.CONFIRMED]: { label: "已确认", variant: "destructive" },
  [MaterialDelayStatus.RESCHEDULED]: { label: "已改期", variant: "info" },
  [MaterialDelayStatus.RESOLVED]: { label: "已解决", variant: "success" },
  [MaterialDelayStatus.CLOSED]: { label: "已关闭", variant: "muted" },
};

const acceptanceStatusMap: StatusMap = {
  [AcceptanceStatus.PENDING]: { label: "待验收", variant: "warning" },
  [AcceptanceStatus.PASSED]: { label: "已通过", variant: "success" },
  [AcceptanceStatus.FAILED]: { label: "未通过", variant: "destructive" },
  [AcceptanceStatus.RE_INSPECTED]: { label: "待复检", variant: "info" },
};

const afterSalesStatusMap: StatusMap = {
  [AfterSalesStatus.OPEN]: { label: "待处理", variant: "warning" },
  [AfterSalesStatus.IN_PROGRESS]: { label: "处理中", variant: "primary" },
  [AfterSalesStatus.PENDING_REVIEW]: { label: "待复核", variant: "info" },
  [AfterSalesStatus.RESOLVED]: { label: "已解决", variant: "success" },
  [AfterSalesStatus.CLOSED]: { label: "已关闭", variant: "muted" },
};

const statusMaps: Record<StatusType, StatusMap> = {
  changeOrder: changeOrderStatusMap,
  materialDelay: materialDelayStatusMap,
  acceptance: acceptanceStatusMap,
  afterSales: afterSalesStatusMap,
};

const variantStyles: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  destructive:
    "bg-destructive/10 text-destructive",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  muted: "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const statusMap = statusMaps[type];
  const statusInfo = statusMap[status] || {
    label: status,
    variant: "default",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[statusInfo.variant] || variantStyles.default,
        className
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          statusInfo.variant === "success" && "bg-green-500",
          statusInfo.variant === "warning" && "bg-amber-500",
          statusInfo.variant === "destructive" && "bg-destructive",
          statusInfo.variant === "info" && "bg-blue-500",
          statusInfo.variant === "primary" && "bg-primary",
          statusInfo.variant === "default" && "bg-muted-foreground",
          statusInfo.variant === "muted" && "bg-muted-foreground/50"
        )}
      />
      {statusInfo.label}
    </span>
  );
}
