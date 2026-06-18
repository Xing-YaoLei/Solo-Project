"use client";

import { AlertTriangle, Clock, AlertOctagon } from "lucide-react";
import { AlertItem } from "@/types";
import clsx from "clsx";

const alertConfig = {
  SHORTAGE: {
    icon: <AlertTriangle size={14} />,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-500",
    label: "短缺",
  },
  EXPIRY_WARNING: {
    icon: <Clock size={14} />,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-500",
    label: "效期",
  },
  OVERDUE: {
    icon: <AlertOctagon size={14} />,
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-500",
    label: "超期",
  },
};

export default function AlertPanel({ alerts }: { alerts: AlertItem[] }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-navy-900 text-sm">异常预警</h3>
        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {alerts.map((alert, idx) => {
          const config = alertConfig[alert.type];
          return (
            <div
              key={alert.id}
              className={clsx(
                "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm animate-slide-in-right",
                config.bg,
                config.border
              )}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={clsx("p-1.5 rounded-md mt-0.5", config.bg)}>
                <span className={config.text}>{config.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx("text-xs font-medium", config.text)}>{alert.message}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  批次 {alert.batchNo} · {alert.timestamp}
                </p>
              </div>
              <span className={clsx("text-[10px] text-white px-1.5 py-0.5 rounded font-medium flex-shrink-0", config.badge)}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
