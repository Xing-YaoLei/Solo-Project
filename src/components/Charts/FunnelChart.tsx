'use client';

import { motion } from 'framer-motion';
import { Funnel, FunnelChart as RechartsFunnel, LabelList, ResponsiveContainer, Tooltip } from 'recharts';
import { formatPercent } from '@/utils/format';
import { FunnelData } from '@/types';

const COLORS = ['#B76E79', '#C97D87', '#D89CA3', '#E4B4B8', '#EDC9CD'];

interface FunnelChartProps {
  data: FunnelData[];
  title: string;
}

export default function FunnelChart({ data, title }: FunnelChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="card p-6"
    >
      <h3 className="font-display text-xl font-semibold text-dark-800 mb-6">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsFunnel data={data}>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white rounded-xl shadow-lg p-4 border border-cream-200">
                      <p className="font-medium text-dark-800">{item.stage}</p>
                      <p className="text-sm text-dark-600">数量: {item.value}</p>
                      <p className="text-sm text-primary-600">
                        转化率: {formatPercent(item.conversionRate)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Funnel dataKey="value" isAnimationActive>
              {data.map((entry, index) => (
                <motion.path
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, opacity: 0.9 }}
                />
              ))}
              <LabelList
                position="right"
                fill="#2D1B33"
                stroke="none"
                dataKey="stage"
                fontSize={12}
              />
              <LabelList
                position="center"
                fill="#fff"
                stroke="none"
                dataKey="value"
                fontSize={14}
                fontWeight={600}
              />
            </Funnel>
          </RechartsFunnel>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-5 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={item.stage} className="text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{ backgroundColor: COLORS[index] }}
            />
            <p className="text-xs text-dark-600">{item.stage}</p>
            <p className="text-xs font-medium text-primary-600">
              {formatPercent(item.conversionRate)}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
