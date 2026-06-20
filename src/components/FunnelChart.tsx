"use client";

import { motion } from "framer-motion";

interface FunnelStage {
  stage: string;
  count: number;
  rate: number;
}

interface FunnelChartProps {
  data: FunnelStage[];
}

const colors = [
  "from-primary-500 to-primary-600",
  "from-cyan-500 to-cyan-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
];

export default function FunnelChart({ data }: FunnelChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex flex-col items-center py-4">
      <div className="w-full max-w-md space-y-2">
        {data.map((stage, index) => {
          const widthPercent = 30 + (stage.count / maxCount) * 70;
          const colorIndex = index % colors.length;

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-20 text-right">
                <span className="text-sm text-slate-400">{stage.stage}</span>
              </div>

              <div className="flex-1 relative h-14">
                <div
                  className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg bg-gradient-to-r ${colors[colorIndex]} shadow-lg flex items-center justify-center overflow-hidden`}
                  style={{
                    width: `${widthPercent}%`,
                    left: `${(100 - widthPercent) / 2}%`,
                    boxShadow: `0 4px 20px rgba(6, 182, 212, ${0.1 + index * 0.05})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <span className="relative font-mono font-bold text-white text-sm">
                    {stage.count.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="w-16 text-left">
                <span className="text-sm font-mono text-primary-400">
                  {stage.rate.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          整体转化率:{" "}
          <span className="font-mono text-emerald-400">
            {data.length > 0
              ? ((data[data.length - 1].count / data[0].count) * 100).toFixed(2)
              : 0}
            %
          </span>
        </p>
      </div>
    </div>
  );
}
