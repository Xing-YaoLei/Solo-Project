'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts';
import { formatDate } from '@/lib/utils';
import type { Satisfaction } from '@/types';

interface SatisfactionTrendChartProps {
  data: Satisfaction[];
  showFollowUp?: boolean;
}

export function SatisfactionTrendChart({
  data,
  showFollowUp = false,
}: SatisfactionTrendChartProps) {
  const chartData = data
    .sort((a, b) => new Date(a.surveyDate).getTime() - new Date(b.surveyDate).getTime())
    .map((s) => ({
      date: formatDate(s.surveyDate),
      rating: s.rating,
      followUpRating: s.followUpRating,
      clientName: s.clientName,
    }));

  const avgRating =
    data.length > 0
      ? data.reduce((sum, s) => sum + s.rating, 0) / data.length
      : 0;

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            domain={[0, 5]}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="font-medium text-slate-900">{item.clientName}</p>
                    <p className="text-sm text-slate-600">调查日期: {item.date}</p>
                    <p className="text-sm text-slate-600">
                      满意度评分: {item.rating} / 5
                    </p>
                    {showFollowUp && item.followUpRating && (
                      <p className="text-sm text-slate-600">
                        跟进评分: {item.followUpRating} / 5
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="#0d9488"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRating)"
            name="满意度"
            isAnimationActive
            animationDuration={800}
          />
          {showFollowUp && (
            <Line
              type="monotone"
              dataKey="followUpRating"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="跟进满意度"
              dot={{ r: 4 }}
              isAnimationActive
              animationDuration={800}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
