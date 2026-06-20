"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface HeatPoint {
  id: string;
  name: string;
  lng: number | null;
  lat: number | null;
  visitorCount: number;
  growthRate: number;
  hasChildren: boolean;
}

interface HeatmapChartProps {
  data: HeatPoint[];
  compareType?: "yoy" | "mom" | "none";
}

export default function HeatmapChart({ data, compareType = "none" }: HeatmapChartProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const maxVisitors = Math.max(...data.map((d) => d.visitorCount), 1);

  const getHeatColor = (count: number) => {
    const ratio = count / maxVisitors;
    if (ratio > 0.75) return "from-red-500 to-orange-500";
    if (ratio > 0.5) return "from-orange-500 to-yellow-500";
    if (ratio > 0.25) return "from-yellow-500 to-green-500";
    return "from-green-500 to-emerald-500";
  };

  const getSize = (count: number) => {
    const ratio = count / maxVisitors;
    return 20 + ratio * 60;
  };

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div className="absolute inset-0 bg-gradient-to-br from-dark-800/50 to-dark-900/50 rounded-xl overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute top-4 left-4 text-xs text-slate-500 font-mono">
          N
          <br />
          ↑
        </div>

        <div className="absolute bottom-4 right-4 text-xs text-slate-500">
          景区热力分布图
        </div>

        <div className="relative w-full h-full p-8">
          {data.map((point, index) => {
            const size = getSize(point.visitorCount);
            const left = 15 + (index % 4) * 22 + (index % 2) * 5;
            const top = 20 + Math.floor(index / 4) * 30;
            const isHovered = hoveredId === point.id;

            return (
              <motion.div
                key={point.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                onMouseEnter={() => setHoveredId(point.id)}
                onMouseLeave={() => setHoveredId(null)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
              >
                <motion.div
                  className={`rounded-full bg-gradient-to-br ${getHeatColor(
                    point.visitorCount
                  )} flex items-center justify-center relative`}
                  style={{ width: size, height: size }}
                  animate={{
                    scale: isHovered ? 1.2 : 1,
                    boxShadow: isHovered
                      ? "0 0 40px rgba(249, 115, 22, 0.5)"
                      : "0 0 20px rgba(6, 182, 212, 0.2)",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="absolute inset-0 rounded-full opacity-30 animate-ping"
                    style={{
                      background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)`,
                    }}
                  />
                </motion.div>

                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 -bottom-16 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-lg p-3 whitespace-nowrap z-10 shadow-xl"
                  >
                    <p className="text-sm font-medium text-white mb-1">
                      {point.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      客流:{" "}
                      <span className="font-mono text-white">
                        {point.visitorCount.toLocaleString()}
                      </span>
                    </p>
                    {compareType !== "none" && (
                      <p
                        className={`text-xs ${
                          point.growthRate >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {compareType === "yoy" ? "同比" : "环比"}:{" "}
                        {point.growthRate >= 0 ? "+" : ""}
                        {point.growthRate.toFixed(1)}%
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
          <span className="text-xs text-slate-500">低</span>
        </div>
        <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500">高</span>
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-orange-500" />
        </div>
      </div>
    </div>
  );
}
