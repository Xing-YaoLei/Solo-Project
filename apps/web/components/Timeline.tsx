"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string;
  time: Date | string;
  operator?: string;
  title?: string;
  content?: string;
  icon?: ReactNode;
  type?: "default" | "success" | "warning" | "destructive" | "info";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const typeStyles: Record<string, { dot: string; line: string }> = {
  default: {
    dot: "border-muted-foreground/30 bg-muted",
    line: "bg-border",
  },
  success: {
    dot: "border-green-500 bg-green-500",
    line: "bg-green-200 dark:bg-green-900",
  },
  warning: {
    dot: "border-amber-500 bg-amber-500",
    line: "bg-amber-200 dark:bg-amber-900",
  },
  destructive: {
    dot: "border-destructive bg-destructive",
    line: "bg-red-200 dark:bg-red-900",
  },
  info: {
    dot: "border-blue-500 bg-blue-500",
    line: "bg-blue-200 dark:bg-blue-900",
  },
};

function formatTime(time: Date | string): string {
  const d = new Date(time);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item, index) => {
        const styles = typeStyles[item.type || "default"];
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                  styles.dot
                )}
              >
                {item.icon && <span className="text-white">{item.icon}</span>}
              </div>
              {!isLast && (
                <div
                  className={cn("w-0.5 flex-1", styles.line)}
                  style={{ minHeight: "2rem" }}
                />
              )}
            </div>

            <div className="flex-1 pb-6 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {item.title && (
                  <span className="font-medium text-foreground">
                    {item.title}
                  </span>
                )}
                {item.operator && (
                  <span className="text-sm text-muted-foreground">
                    · {item.operator}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTime(item.time)}
              </p>
              {item.content && (
                <p className="mt-2 text-sm text-foreground/80">{item.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
