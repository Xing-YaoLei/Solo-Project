'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { ConsumptionData } from '@/types';
import { cn } from '@/utils/cn';

const COLORS = ['#B76E79', '#E8B4B8', '#C9A961', '#7E6D87', '#DCC0A6', '#AFA2B5'];

interface ConsumptionChartProps {
  data: ConsumptionData[];
  onDimensionChange: (dim: 'item' | 'amount' | 'time') => void;
}

export default function ConsumptionChart({ data, onDimensionChange }: ConsumptionChartProps) {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [dimension, setDimension] = useState<'item' | 'amount' | 'time'>('item');

  const handleDimensionChange = (dim: 'item' | 'amount' | 'time') => {
    setDimension(dim);
    onDimensionChange(dim);
  };

  const dimensions: { key: 'item' | 'amount' | 'time'; label: string }[] = [
    { key: 'item', label: '按项目' },
    { key: 'amount', label: '按金额' },
    { key: 'time', label: '按时段' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-dark-800">消费记录分布</h3>
        <div className="flex gap-2">
          <div className="flex bg-cream-100 rounded-lg p-1">
            {dimensions.map(dim => (
              <button
                key={dim.key}
                onClick={() => handleDimensionChange(dim.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                  dimension === dim.key
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-dark-600 hover:text-dark-800'
                )}
              >
                {dim.label}
              </button>
            ))}
          </div>
          <div className="flex bg-cream-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('pie')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                chartType === 'pie'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-dark-600 hover:text-dark-800'
              )}
            >
              饼图
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                chartType === 'bar'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-dark-600 hover:text-dark-800'
              )}
            >
              柱状图
            </button>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white rounded-xl shadow-lg p-4 border border-cream-200">
                        <p className="font-medium text-dark-800">{item.name}</p>
                        <p className="text-sm text-dark-600">数量: {item.count || item.value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ left: 20, right: 20 }}>
              <XAxis dataKey="name" fontSize={12} tick={{ fill: '#5A4764' }} />
              <YAxis fontSize={12} tick={{ fill: '#5A4764' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white rounded-xl shadow-lg p-4 border border-cream-200">
                        <p className="font-medium text-dark-800">{item.name}</p>
                        <p className="text-sm text-dark-600">数量: {item.count || item.value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
