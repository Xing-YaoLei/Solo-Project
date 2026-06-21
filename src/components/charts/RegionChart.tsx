"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RegionChartProps {
  data: Array<{
    regionName: string;
    totalSubsidy: number;
    orderCount: number;
    avgSubsidy: number;
  }>;
  height?: number;
}

export default function RegionChart({ data, height = 300 }: RegionChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes("补贴") || entry.name.includes("金额")
                ? formatCurrency(entry.value)
                : entry.name.includes("订单")
                  ? `${entry.value} 单`
                  : entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis dataKey="regionName" type="category" tick={{ fontSize: 12 }} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey="totalSubsidy" name="补贴总金额" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        <Bar dataKey="avgSubsidy" name="单均补贴" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
