"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  data: Array<{ name: string; 核销次数: number; 核销金额: number }>;
}

export default function RedemptionRanking({ data }: Props) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,111,71,0.08)" />
          <XAxis type="number" stroke="#8B8378" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#8B8378"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1613",
              border: "1px solid #2D2722",
              borderRadius: 12,
              color: "#E8E0D5",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ color: "#8B8378", fontSize: 12 }} />
          <Bar dataKey="核销金额" fill="#C9A961" radius={[0, 6, 6, 0]} name="核销金额(元)" />
          <Bar dataKey="核销次数" fill="#6B5A45" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
