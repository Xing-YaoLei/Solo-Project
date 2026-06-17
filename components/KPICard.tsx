"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  format?: "number" | "percent" | "currency";
  yoy?: number;
  mom?: number;
  accentColor?: "primary" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}

function AnimatedNumber({
  value,
  decimals = 0,
}: {
  value: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();
    const startValue = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplay(startValue + (value - startValue) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

function TrendIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value >= 0;
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        isPositive ? "text-success" : "text-danger"
      )}
    >
      {isPositive ? (
        <TrendingUp size={12} />
      ) : (
        <TrendingDown size={12} />
      )}
      <span>{Math.abs(value).toFixed(1)}%</span>
      <span className="text-muted">{label}</span>
    </div>
  );
}

export function KPICard({
  title,
  value,
  unit,
  format = "number",
  yoy,
  mom,
  accentColor = "primary",
  icon,
}: KPICardProps) {
  const accentColors = {
    primary: "from-primary/20 to-transparent border-primary/30",
    success: "from-success/20 to-transparent border-success/30",
    warning: "from-warning/20 to-transparent border-warning/30",
    danger: "from-danger/20 to-transparent border-danger/30",
  };

  const textColors = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  const formatDisplay = (val: number | string): { num: number; suffix: string; decimals: number } => {
    if (typeof val === "string") {
      return { num: 0, suffix: val, decimals: 0 };
    }
    switch (format) {
      case "percent":
        return { num: val, suffix: "%", decimals: 1 };
      case "currency":
        return { num: val, suffix: "", decimals: 2 };
      default:
        return { num: val, suffix: unit ?? "", decimals: 0 };
    }
  };

  const formatted = formatDisplay(value);

  return (
    <div
      className={cn(
        "glass-card-hover gradient-border p-5 relative overflow-hidden",
        "animate-fade-in"
      )}
      style={{
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-40 pointer-events-none bg-gradient-to-br",
          accentColors[accentColor]
        )}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted font-medium">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              {format === "currency" && (
                <span className={cn("text-2xl font-display font-bold", textColors[accentColor])}>
                  ¥
                </span>
              )}
              <span
                className={cn(
                  "text-3xl font-display font-bold font-mono tracking-tight",
                  textColors[accentColor]
                )}
              >
                {typeof value === "string" ? (
                  value
                ) : (
                  <AnimatedNumber value={formatted.num} decimals={formatted.decimals} />
                )}
              </span>
              {formatted.suffix && format !== "currency" && (
                <span className="text-lg text-muted ml-0.5">{formatted.suffix}</span>
              )}
            </div>
          </div>
          {icon && (
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-surface-200 border border-border"
              )}
            >
              <div className={textColors[accentColor]}>{icon}</div>
            </div>
          )}
        </div>

        {(yoy !== undefined || mom !== undefined) && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4">
            {yoy !== undefined && <TrendIndicator value={yoy} label="同比" />}
            {mom !== undefined && <TrendIndicator value={mom} label="环比" />}
          </div>
        )}
      </div>
    </div>
  );
}
