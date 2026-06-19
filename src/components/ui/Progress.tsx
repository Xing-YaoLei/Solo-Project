import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ProgressColor = "primary" | "accent" | "success" | "danger" | "warning" | "info";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: string;
  color?: ProgressColor;
  showValue?: boolean;
}

const colorClasses: Record<ProgressColor, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
};

export function Progress({
  value, label, color = "primary", showValue = false, className, ...props }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)} {...props}>
      {(label || showValue) && (
        <div className="flex justify-between mb-2">
          {label && <span className="text-sm text-neutral-600">{label}</span>}
          {showValue && (
            <span className="text-sm font-medium text-neutral-800">{clampedValue}%</span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out animate-progress-fill",
            colorClasses[color]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export default Progress;
