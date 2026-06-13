'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { InventoryRank } from '@/types';
import { formatPercent } from '@/utils/format';
import { cn } from '@/utils/cn';

interface InventoryRankChartProps {
  data: InventoryRank[];
}

export default function InventoryRankChart({ data }: InventoryRankChartProps) {
  const maxValue = Math.max(...data.map(d => d.totalUsed));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="card p-6"
    >
      <h3 className="font-display text-xl font-semibold text-dark-800 mb-6">库存领用排行</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            className="group"
          >
            <div className="flex items-center gap-4 mb-2">
              <span className={
                `w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < 3
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white'
                    : 'bg-cream-200 text-dark-600'
                }`
              }>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-dark-800 truncate">{item.productName}</p>
                  {item.abnormalCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertTriangle className="w-3 h-3" />
                      {item.abnormalCount}个异常
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-500">{item.category}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-dark-800">{item.totalUsed}</p>
                <p className="text-xs text-dark-500">次领用</p>
              </div>
            </div>
            <div className="ml-11">
              <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.totalUsed / maxValue) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                  className={cn(
                    'h-full rounded-full',
                    item.abnormalRate > 0.05
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : 'bg-gradient-to-r from-primary-400 to-primary-500'
                  )}
                />
              </div>
              {item.abnormalRate > 0 && (
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-dark-500">异常率</span>
                  <span className={cn(
                    'font-medium',
                    item.abnormalRate > 0.05 ? 'text-red-500' : 'text-dark-600'
                  )}>
                    {formatPercent(item.abnormalRate)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
