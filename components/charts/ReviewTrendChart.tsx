'use client';

import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from 'recharts';
import { AlertTriangle, TrendingUp, Users } from 'lucide-react';
import type { TrendDataPoint, AnomalyExplanation } from '@/types';
import { getAnomalyExplanation } from '@/lib/mockData';

interface ReviewTrendChartProps {
  data: TrendDataPoint[];
  onAnomalyClick?: (period: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip min-w-48">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm mb-1">
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-mono font-medium" style={{ color: entry.color }}>
              {entry.value}
            </span>
          </div>
        ))}
        {data.isAnomaly && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">异常点</span>
            </div>
            {data.anomalyReason && (
              <p className="text-xs text-gray-500 mt-1">{data.anomalyReason}</p>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function ReviewTrendChart({ data, onAnomalyClick }: ReviewTrendChartProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<AnomalyExplanation | null>(null);

  const handleDotClick = useCallback((entry: any) => {
    if (entry.payload.isAnomaly) {
      const period = entry.payload.month;
      setSelectedAnomaly(period);
      setExplanation(getAnomalyExplanation(period));
      onAnomalyClick?.(period);
    }
  }, [onAnomalyClick]);

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isAnomaly) {
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={8}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={2}
            className="anomaly-dot cursor-pointer"
            onClick={() => handleDotClick(props)}
          />
          <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="none"
            stroke="#ef4444"
            strokeWidth={1}
            opacity={0.3}
          />
        </g>
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill="#2d5a87" stroke="#fff" strokeWidth={2} />;
  };

  return (
    <div className="w-full">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2d5a87" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2d5a87" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-600">
                  {value === 'applications' ? '申请数' : value === 'passed' ? '通过数' : '材料缺失数'}
                </span>
              )}
            />

            {data.map((entry, index) => (
              entry.isAnomaly && (
                <ReferenceArea
                  key={`gap-${index}`}
                  x1={data[index - 1]?.month || entry.month}
                  x2={data[index + 1]?.month || entry.month}
                  y1={0}
                  y2={entry.applications}
                  fill="rgba(239, 68, 68, 0.1)"
                  stroke="rgba(239, 68, 68, 0.3)"
                  strokeDasharray="3 3"
                />
              )
            ))}

            <Area
              type="monotone"
              dataKey="applications"
              stroke="#2d5a87"
              strokeWidth={3}
              fill="url(#colorApplications)"
              dot={renderCustomDot}
              activeDot={{ r: 6 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="passed"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorPassed)"
              dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="missingMaterials"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {explanation && selectedAnomaly && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900">
                  {selectedAnomaly} 异常点分析
                </h4>
                <span className="text-sm text-red-600 font-medium">
                  偏离 {explanation.deviationPercent}%
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                实际值 {explanation.anomalyValue}，预期值 {explanation.expectedValue}，
                偏差 {explanation.deviation}
              </p>
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">导师名额影响</span>
                </div>
                <p className="text-sm text-gray-600">
                  {explanation.supervisorQuotaImpact.impactDescription}
                </p>
                <div className="flex gap-6 mt-2 text-xs text-gray-500">
                  <span>预期名额: <span className="font-mono font-medium text-gray-700">{explanation.supervisorQuotaImpact.expectedQuota}</span></span>
                  <span>实际名额: <span className="font-mono font-medium text-gray-700">{explanation.supervisorQuotaImpact.actualQuota}</span></span>
                </div>
              </div>
              {explanation.otherFactors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">其他影响因素：</p>
                  <div className="flex flex-wrap gap-2">
                    {explanation.otherFactors.map((factor, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedAnomaly(null);
                setExplanation(null);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!explanation && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-breathe" />
            <span>点击红色异常点查看详细分析</span>
          </div>
          <span className="mx-2">|</span>
          <span>材料缺失数为虚线表示</span>
        </div>
      )}
    </div>
  );
}
