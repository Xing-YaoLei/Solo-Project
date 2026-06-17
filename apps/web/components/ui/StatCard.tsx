"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatColor = "default" | "primary" | "success" | "warning" | "destructive" | "info";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  color?: StatColor;
  className?: string;
  footer?: ReactNode;
}

const colorStyles: Record<StatColor, {
  bg: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}> = {
  default: {
    bg: "bg-card",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
  },
  primary: {
    bg: "bg-card",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    valueColor: "text-foreground",
  },
  success: {
    bg: "bg-card",
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    valueColor: "text-foreground",
  },
  warning: {
    bg: "bg-card",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    valueColor: "text-foreground",
  },
  destructive: {
    bg: "bg-card",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    valueColor: "text-foreground",
  },
  info: {
    bg: "bg-card",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-foreground",
  },
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "default",
  className,
  footer,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "rounded-lg border p-6 shadow-sm transition-shadow hover:shadow",
        styles.bg,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className={cn("mt-2 text-3xl font-bold", styles.valueColor)}>
            {value}
          </h3>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              styles.iconBg
            )}
          >
            <div className={styles.iconColor}>{icon}</div>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              trend.isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-sm text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}

      {footer && <div className="mt-4 pt-4 border-t">{footer}</div>}
    </div>
  );
}
