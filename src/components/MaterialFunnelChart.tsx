"use client";

import React from "react";
import {
  Funnel,
  FunnelChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface FunnelStageItem {
  stage: string;
  label: string;
  value: number;
  count: number;
  shortageQty: number;
  shortageCount: number;
  avgTurnoverDays: number;
  conversionRate: number;
}

interface MaterialFunnelChartProps {
  stages: FunnelStageItem[];
  onClickStage?: (stage: FunnelStageItem) => void;
}

const BASE_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
];

export function MaterialFunnelChart({ stages, onClickStage }: MaterialFunnelChartProps) {
  const data = stages.map((s, i) => ({
    ...s,
    name: s.label,
    fill: BASE_COLORS[i % BASE_COLORS.length],
  }));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">材料进场漏斗</div>
          <div className="text-xs text-slate-500 mt-0.5">按阶段展示计划 → 实际流转，红色标记为批次短缺影响</div>
        </div>
        <div className="flex gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-primary-500"></span>
            <span className="text-slate-500">正常流转</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-shortage"></span>
            <span className="text-slate-500">短缺批次</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 10, right: 180, left: 20, bottom: 10 }}>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                formatter={(value: number) => [value.toLocaleString(), "总数量"]}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as FunnelStageItem & { name: string };
                  return (
                    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-sm min-w-[220px]">
                      <div className="font-semibold text-slate-800 mb-2">{item.name}</div>
                      <div className="space-y-1 text-slate-600">
                        <div className="flex justify-between gap-6">
                          <span>流转数量</span>
                          <span className="font-medium text-slate-800">{item.value.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span>覆盖批次</span>
                          <span className="font-medium text-slate-800">{item.count}</span>
                        </div>
                        <div className="flex justify-between gap-6 text-shortage-dark">
                          <span>短缺数量</span>
                          <span className="font-medium">{item.shortageQty.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-6 text-shortage-dark">
                          <span>短缺批次</span>
                          <span className="font-medium">{item.shortageCount}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span>平均周转天数</span>
                          <span className="font-medium text-slate-800">{item.avgTurnoverDays} 天</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span>阶段转化率</span>
                          <span className="font-medium text-primary-700">{item.conversionRate}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Funnel
                dataKey="value"
                data={data}
                isAnimationActive={false}
              >
                <LabelList
                  position="right"
                  fill="#0f172a"
                  stroke="none"
                  formatter={(v: number, index: number) => {
                    const entry = data[Number(index)];
                    const label = entry?.label || "";
                    return `${label} · ${v.toLocaleString()}`;
                  }}
                  fontSize={13}
                />
                {data.map((entry, index) => {
                  const hasShortage = entry.shortageCount > 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={hasShortage ? "#ef4444" : entry.fill}
                      stroke={hasShortage ? "#b91c1c" : "none"}
                      strokeWidth={hasShortage ? 2 : 0}
                      style={{
                        cursor: onClickStage ? "pointer" : "default",
                        filter: hasShortage ? "drop-shadow(0 0 6px rgba(239,68,68,0.35))" : "none",
                      }}
                      onClick={() => onClickStage?.(entry)}
                    />
                  );
                })}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {data.map((s, i) => (
            <div
              key={s.stage}
              onClick={() => onClickStage?.(s)}
              className={`rounded-lg p-3 cursor-pointer transition-colors ${
                s.shortageCount > 0 ? "bg-shortage-light/70 border border-shortage/30" : "bg-slate-50 border border-slate-100 hover:bg-slate-100"
              }`}
            >
              <div className="text-xs font-medium text-slate-500 mb-1">{i + 1}. {s.label}</div>
              <div className={`text-lg font-bold ${s.shortageCount > 0 ? "text-shortage-dark" : "text-slate-800"}`}>
                {s.value.toLocaleString()}
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-slate-500">转化率 {s.conversionRate}%</span>
                {s.shortageCount > 0 && (
                  <span className="text-shortage-dark font-medium">缺{s.shortageCount}批</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
