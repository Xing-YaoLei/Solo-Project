"use client";

import clsx from "clsx";

const labelMap: Record<string, string> = {
  LOW: "低风险",
  MEDIUM: "中风险",
  HIGH: "高风险",
  CRITICAL: "严重",
};

interface RiskBadgeProps {
  level: string;
}

export default function RiskBadge({ level }: RiskBadgeProps) {
  const upper = level.toUpperCase();
  const badgeClass = clsx({
    "badge-low": upper === "LOW",
    "badge-medium": upper === "MEDIUM",
    "badge-high": upper === "HIGH",
    "badge-critical": upper === "CRITICAL",
  });

  return <span className={badgeClass}>{labelMap[upper] ?? level}</span>;
}
