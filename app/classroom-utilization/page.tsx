'use client';

import { useState } from 'react';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import UtilizationComparisonChart from '@/components/charts/UtilizationComparisonChart';
import {
  getUtilizationComparison,
  getWeeklyUtilizationTrend,
  getClassroomRank,
} from '@/lib/mockData';
import type { ClassroomRank } from '@/types';
import clsx from 'clsx';

export default function ClassroomUtilizationPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const utilizationData = getUtilizationComparison();
  const weeklyTrend = getWeeklyUtilizationTrend();
  const classroomRank = getClassroomRank();

  const buildings = ['all', ...new Set(classroomRank.map(c => c.building))];

  const filteredRank = selectedBuilding === 'all'
    ? classroomRank
    : classroomRank.filter(c => c.building === selectedBuilding);

  const avgUtilization = (
    filteredRank.reduce((sum, c) => sum + c.utilizationRate, 0) / filteredRank.length
  ).toFixed(1);

  const latestUtilization = utilizationData[utilizationData.length - 1];
  const improvementCount = utilizationData.filter(d => d.isImproved).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-gray-900 mb-2">
          教室利用率分析
        </h1>
        <p className="text-gray-500">
          同比、环比、目标值多维度对比，改善效果复盘
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card-gradient p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">当前利用率</span>
            <Building2 className="w-5 h-5 text-primary-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-primary-700 mb-1">
            {latestUtilization.current.toFixed(1)}%
          </div>
          <div className={clsx(
            'text-xs flex items-center gap-1',
            latestUtilization.current >= latestUtilization.target ? 'text-emerald-600' : 'text-amber-600'
          )}>
            <Target className="w-3 h-3" />
            {latestUtilization.current >= latestUtilization.target
              ? '已超过目标值'
              : `距目标值 ${(latestUtilization.target - latestUtilization.current).toFixed(1)}%`}
          </div>
        </div>

        <div className="card-gradient p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">同比增长</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className={clsx(
            'text-3xl font-bold font-mono',
            latestUtilization.yearOnYear > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {latestUtilization.yearOnYear > 0 ? '+' : ''}{latestUtilization.yearOnYear.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">较去年同期</div>
        </div>

        <div className="card-gradient p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">环比增长</span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div className={clsx(
            'text-3xl font-bold font-mono',
            latestUtilization.monthOnMonth > 0 ? 'text-emerald-600' : 'text-red-600'
          )}>
            {latestUtilization.monthOnMonth > 0 ? '+' : ''}{latestUtilization.monthOnMonth.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">较上学期</div>
        </div>

        <div className="card-gradient p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">改善学期数</span>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-purple-600">
            {improvementCount} / {utilizationData.length}
          </div>
          <div className="text-xs text-gray-500">连续改善学期</div>
        </div>
      </div>

      <div className="card-gradient p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">利用率多维度对比</h2>
            <p className="text-sm text-gray-500">同比、环比、目标值三线对比</p>
          </div>
        </div>
        <UtilizationComparisonChart data={utilizationData} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">学期周利用率趋势</h2>
              <p className="text-sm text-gray-500">2024-2025学年第一学期</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={3}
                />
                <YAxis
                  domain={[40, 85]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <ReferenceLine
                  y={65}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  label={{ value: '目标', position: 'right', fill: '#8b5cf6', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0]?.value;
                      const numericValue = typeof value === 'number' ? value : Number(value);
                      return (
                        <div className="custom-tooltip">
                          <p className="font-semibold text-gray-900 mb-1">{label}</p>
                          <p className="text-sm text-gray-600">
                            利用率: <span className="font-mono font-medium text-emerald-600">{numericValue.toFixed(1)}%</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorWeekly)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-gradient p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">改善措施复盘</h2>
              <p className="text-sm text-gray-500">各学期改善措施与效果</p>
            </div>
          </div>
          <div className="space-y-4">
            {utilizationData.map((item, idx) => (
              item.improvementMeasure && (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl border border-emerald-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-gray-900">{item.period}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.improvementMeasure}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-emerald-600">
                        +{item.monthOnMonth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">环比提升</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-100">
                    <div className="flex-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${item.current}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-mono text-gray-700">
                      {item.current}%
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      <div className="card-gradient p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">教室利用率排名</h2>
            <p className="text-sm text-gray-500">
              按当前学期平均利用率排序，平均: <span className="font-mono font-medium text-primary-600">{avgUtilization}%</span>
            </p>
          </div>
          <div className="flex gap-2">
            {buildings.map((building) => (
              <button
                key={building}
                onClick={() => setSelectedBuilding(building)}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  selectedBuilding === building
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {building === 'all' ? '全部' : building}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredRank.map((classroom, idx) => (
            <div
              key={classroom.id}
              className={clsx(
                'p-4 rounded-xl border transition-all duration-300 hover:shadow-md',
                idx === 0
                  ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200'
                  : idx === 1
                  ? 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
                  : idx === 2
                  ? 'bg-gradient-to-r from-orange-50 to-white border-orange-200'
                  : 'bg-white border-gray-100'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg',
                  idx === 0
                    ? 'bg-amber-500 text-white'
                    : idx === 1
                    ? 'bg-gray-400 text-white'
                    : idx === 2
                    ? 'bg-orange-400 text-white'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {classroom.building} {classroom.roomNo}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {classroom.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    容量 {classroom.capacity} 人
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold font-mono text-primary-700">
                      {classroom.utilizationRate.toFixed(1)}%
                    </span>
                    {classroom.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : classroom.trend === 'down' ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-1000',
                      classroom.utilizationRate >= 70
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : classroom.utilizationRate >= 55
                        ? 'bg-gradient-to-r from-primary-400 to-primary-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    )}
                    style={{ width: `${classroom.utilizationRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
