"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { InventoryDistribution } from "@/types";
import { getInventoryDistribution } from "@/lib/mock-data";

const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4", "#F97316", "#EC4899"];

export default function InventoryDistributionChart() {
  const data = getInventoryDistribution();

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 card-shadow">
      <h3 className="font-display font-semibold text-navy-900 text-sm mb-4">库存台账分布</h3>
      <div className="flex flex-col lg:flex-row items-center gap-4">
        <div className="h-[240px] w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="quantity"
                nameKey="category"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1B2A4A",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`${value} 件`, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full lg:w-1/2 space-y-2">
          {data.map((item, idx) => (
            <div key={item.category} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-xs text-slate-600 w-16 truncate">{item.category}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: COLORS[idx % COLORS.length],
                  }}
                />
              </div>
              <span className="text-xs font-medium text-navy-900 w-12 text-right">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
