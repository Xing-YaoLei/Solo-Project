"use client";

import { ReactNode } from "react";
import { X, CheckSquare, Download, UserPlus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BatchAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "primary" | "destructive";
  disabled?: boolean;
}

interface BatchOperationBarProps {
  selectedCount: number;
  totalCount?: number;
  onClear?: () => void;
  actions?: BatchAction[];
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<string, string> = {
  default:
    "bg-background text-foreground border hover:bg-muted",
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

export function BatchOperationBar({
  selectedCount,
  totalCount,
  onClear,
  actions,
  className,
  children,
}: BatchOperationBarProps) {
  if (selectedCount === 0) return null;

  const defaultActions: BatchAction[] = [
    {
      label: "状态变更",
      icon: <Tag className="h-4 w-4" />,
      onClick: () => {},
      variant: "default",
    },
    {
      label: "分配",
      icon: <UserPlus className="h-4 w-4" />,
      onClick: () => {},
      variant: "default",
    },
    {
      label: "导出",
      icon: <Download className="h-4 w-4" />,
      onClick: () => {},
      variant: "default",
    },
  ];

  const displayActions = actions || defaultActions;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border bg-primary/5 px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckSquare className="h-4 w-4" />
        </div>
        <div>
          <span className="font-medium">
            已选择 {selectedCount} 项
          </span>
          {totalCount !== undefined && (
            <span className="text-sm text-muted-foreground">
              {" "}
              / 共 {totalCount} 项
            </span>
          )}
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="ml-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            取消选择
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        {displayActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              variantStyles[action.variant || "default"],
              action.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
