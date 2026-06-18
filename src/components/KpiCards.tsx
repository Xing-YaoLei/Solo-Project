"use client";

import { useEffect, useState } from "react";
import { Package, Warehouse, Clock, AlertTriangle } from "lucide-react";
import { KpiData } from "@/types";
import clsx from "clsx";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color: "amber" | "emerald" | "slate" | "coral";
  delay?: number;
}

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

const colorMap = {
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-500",
    border: "border-amber-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-500",
    border: "border-emerald-500/20",
  },
  slate: {
    bg: "bg-slate-500/10",
    icon: "text-slate-600",
    border: "border-slate-500/20",
  },
  coral: {
    bg: "bg-red-500/10",
    icon: "text-red-500",
    border: "border-red-500/20",
  },
};

export default function KpiCards({ data }: { data: KpiData }) {
  const cards: KpiCardProps[] = [
    {
      label: "当月进场总量",
      value: data.monthlyTotal,
      suffix: "件",
      icon: <Package size={22} />,
      color: "amber",
      delay: 0,
    },
    {
      label: "在库总量",
      value: data.inStockTotal,
      suffix: "件",
      icon: <Warehouse size={22} />,
      color: "emerald",
      delay: 100,
    },
    {
      label: "周转天数均值",
      value: Math.round(data.avgTurnoverDays * 10) / 10,
      suffix: "天",
      icon: <Clock size={22} />,
      color: "slate",
      delay: 200,
    },
    {
      label: "短缺批次数",
      value: data.shortageBatchCount,
      suffix: "批",
      icon: <AlertTriangle size={22} />,
      color: "coral",
      delay: 300,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const colors = colorMap[card.color];
        return (
          <div
            key={card.label}
            className={clsx(
              "bg-white rounded-xl p-5 border card-shadow hover:card-shadow-hover transition-all duration-300 animate-count-up",
              colors.border
            )}
            style={{ animationDelay: `${card.delay}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{card.label}</p>
                <p className="text-2xl font-display font-bold text-navy-900">
                  <AnimatedNumber value={card.value} />
                  <span className="text-sm font-normal text-slate-500 ml-1">{card.suffix}</span>
                </p>
              </div>
              <div className={clsx("p-2.5 rounded-lg", colors.bg)}>
                <span className={colors.icon}>{card.icon}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
