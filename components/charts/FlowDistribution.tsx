"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  data: Array<{ name: string; 充值: number; 消费: number }>;
}

export default function FlowDistribution({ data }: Props) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,111,71,0.08)" />
          <XAxis dataKey="name" stroke="#8B8378" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#8B8378" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1613",
              border: "1px solid #2D2722",
              borderRadius: 12,
              color: "#E8E0D5",
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(139,111,71,0.05)" }}
          />
          <Legend wrapperStyle={{ color: "#8B8378", fontSize: 12 }} />
          <Bar dataKey="充值" fill="#C9A961" radius={[6, 6, 0, 0]} />
          <Bar dataKey="消费" fill="#8B6F47" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
