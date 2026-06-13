"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Props {
  data: Array<Record<string, unknown>>;
  reasons: string[];
}

const COLORS = ["#C9A961", "#8B6F47", "#B84A4A", "#4A8B5C", "#6B8BB8"];

export default function RefundTrend({ data, reasons }: Props) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,111,71,0.08)" />
          <XAxis dataKey="date" stroke="#8B8378" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#8B8378" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1613",
              border: "1px solid #2D2722",
              borderRadius: 12,
              color: "#E8E0D5",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ color: "#8B8378", fontSize: 11 }} />
          {reasons.map((reason, i) => (
            <Line
              key={reason}
              type="monotone"
              dataKey={reason}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
