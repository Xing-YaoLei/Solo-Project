"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: "primary" | "accent" | "emerald" | "violet";
  delay?: number;
}

const colorMap = {
  primary: "from-primary-500/20 to-primary-500/5 text-primary-400",
  accent: "from-accent-500/20 to-accent-500/5 text-accent-400",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
  violet: "from-violet-500/20 to-violet-500/5 text-violet-400",
};

export default function StatCard({
  title,
  value,
  change,
  changeLabel = "较上期",
  icon,
  color = "primary",
  delay = 0,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card glass-card-hover p-5 relative overflow-hidden"
    >
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
          color === "primary"
            ? "from-primary-500 to-primary-400"
            : color === "accent"
            ? "from-accent-500 to-accent-400"
            : color === "emerald"
            ? "from-emerald-500 to-emerald-400"
            : "from-violet-500 to-violet-400"
        }`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-2">{title}</p>
          <p className="font-mono text-2xl font-bold text-white">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}
          >
            {icon}
          </div>
        )}
      </div>

      {change !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          {isPositive && (
            <TrendingUp size={16} className="text-emerald-400" />
          )}
          {isNegative && (
            <TrendingDown size={16} className="text-red-400" />
          )}
          {isNeutral && <Minus size={16} className="text-slate-500" />}
          <span
            className={`text-sm font-medium ${
              isPositive
                ? "text-emerald-400"
                : isNegative
                ? "text-red-400"
                : "text-slate-500"
            }`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500">{changeLabel}</span>
        </div>
      )}
    </motion.div>
  );
}
